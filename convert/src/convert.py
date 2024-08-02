import os
import json
import datetime
from xml.dom import minidom
import traceback
import base64
import magic

def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
    base64_encoded_data = base64.b64encode(image_data).decode('utf-8')
    return base64_encoded_data

def create_sms_element(doc, entry):
    sms = doc.createElement('sms')

    sms.setAttribute('protocol', '0')
    sms.setAttribute('address', entry["sender"])
    sms.setAttribute('date', str(entry["timestamp"]))
    sms.setAttribute('type', '1' if entry["delivery"] == "received" else '2')
    sms.setAttribute('subject', 'null')
    sms.setAttribute('body', entry["body"])
    sms.setAttribute('toa', 'null')
    sms.setAttribute('sc_toa', 'null')
    sms.setAttribute('service_center', 'null')
    sms.setAttribute('read', str(int(entry["read"])))
    sms.setAttribute('status', '1' if entry["deliveryTimestamp"] != '' else '0')
    sms.setAttribute('locked', '0')
    sms.setAttribute('date_sent', str(entry["sentTimestamp"]))
    sms.setAttribute('sub_id', '1')
    readable_date = ""
    try:
        readable_date = datetime.datetime.fromtimestamp(int(entry["timestamp"]) / 1000).strftime("%-d %b %Y %-I.%-M.%-S %p")
        if readable_date == "":
                readable_date = datetime.datetime.fromtimestamp(int(entry["timestamp"]) / 1000).strftime("%d %b %Y %I.%M.%S %p")
    except:
         readable_date = datetime.datetime.fromtimestamp(int(entry["timestamp"]) / 1000).strftime("%d %b %Y %I.%M.%S %p")
    sms.setAttribute('readable_date', readable_date)
    sms.setAttribute('contact_name', '(Unknown)')

    return sms

def create_mms_element(doc, entry):
    mms = doc.createElement('mms')

    mms.setAttribute('date', str(entry["timestamp"]))
    mms.setAttribute('rr', '129' if entry["readReportRequested"] else '128')
    mms.setAttribute('sub', entry["subject"] or 'null')
    mms.setAttribute('ct_t', 'application/vnd.wap.multipart.related')
    mms.setAttribute('read_status', 'null')
    mms.setAttribute('seen', '1' if entry["read"] else '0')
    mms.setAttribute('msg_box', '2' if entry["delivery"] == "sent" else '1')
    mms.setAttribute('address', entry["receivers"][0])
    mms.setAttribute('sub_cs', 'null')
    mms.setAttribute('resp_st', '128')
    mms.setAttribute('retr_st', 'null')
    mms.setAttribute('d_tm', 'null')
    mms.setAttribute('text_only', '0')
    mms.setAttribute('exp', str(entry["expiryDate"]) if entry["expiryDate"] != 0 else '604800')
    mms.setAttribute('locked', '0')
    mms.setAttribute('m_id', entry["iccId"])
    mms.setAttribute('st', 'null')
    mms.setAttribute('retr_txt_cs', 'null')
    mms.setAttribute('retr_txt', 'null')
    mms.setAttribute('creator', entry.get("creator", "com.google.android.apps.messaging"))
    mms.setAttribute('date_sent', str(entry["sentTimestamp"]))
    mms.setAttribute('read', '1' if entry["read"] else '0')
    mms.setAttribute('m_size', str(os.stat(os.curdir + "/MMS_Content/" + entry["attachments"][0]["location"]).st_size))
    mms.setAttribute('rpt_a', 'null')
    mms.setAttribute('ct_cls', 'null')
    mms.setAttribute('pri', '129')
    mms.setAttribute('sub_id', '1')
    mms.setAttribute('tr_id', base64.b64encode(entry["iccId"].encode()).decode())
    mms.setAttribute('resp_txt', 'null')
    mms.setAttribute('ct_l', 'null')
    mms.setAttribute('m_cls', 'personal')
    mms.setAttribute('d_rpt', '129')
    mms.setAttribute('v', '18')
    mms.setAttribute('_id', str(entry["id"]))
    mms.setAttribute('m_type', '128')
    readable_date = ""
    try:
        readable_date = datetime.datetime.fromtimestamp(int(entry["timestamp"]) / 1000).strftime("%-d %b %Y %-I.%-M.%-S %p")
        if readable_date == "":
                readable_date = datetime.datetime.fromtimestamp(int(entry["timestamp"]) / 1000).strftime("%d %b %Y %I.%M.%S %p")
    except:
         readable_date = datetime.datetime.fromtimestamp(int(entry["timestamp"]) / 1000).strftime("%d %b %Y %I.%M.%S %p")   
    mms.setAttribute('readable_date', readable_date)
    mms.setAttribute('contact_name', entry["receivers"][0])
    
    parts = doc.createElement('parts')
    smil = entry.get("smil", "")
    smil_part = doc.createElement('part')
    smil_part.setAttribute('seq', '-1')
    smil_part.setAttribute('ct', 'application/smil')
    smil_part.setAttribute('name', 'null')
    smil_part.setAttribute('chset', 'null')
    smil_part.setAttribute('cd', 'null')
    smil_part.setAttribute('fn', 'null')
    smil_part.setAttribute('cid', '&lt;smil&gt;')
    smil_part.setAttribute('cl', 'smil.xml')
    smil_part.setAttribute('ctt_s', 'null')
    smil_part.setAttribute('ctt_t', 'null')
    smil_part.setAttribute('text', smil)
    parts.appendChild(smil_part)
    
    for i, attachment in enumerate(entry["attachments"]):
        part = doc.createElement('part')
        part.setAttribute('seq', str(i))
        part.setAttribute('ct', magic.from_file(str(os.curdir + "/MMS_Content/" + attachment["location"]), mime=True))
        part.setAttribute('name', 'null')
        part.setAttribute('chset', 'null')
        part.setAttribute('cd', 'null')
        part.setAttribute('fn', 'null')
        part.setAttribute('cid', f'&lt;{attachment["id"]}&gt;')
        part.setAttribute('cl', attachment["location"])
        part.setAttribute('ctt_s', 'null')
        part.setAttribute('ctt_t', 'null')
        part.setAttribute('text', 'null')
        part.setAttribute('data',  encode_image_to_base64(os.curdir + "/MMS_Content/" + attachment["location"]))
        parts.appendChild(part)
    
    mms.appendChild(parts)
    return mms


def create_smses_element(doc, parsed_file, backup_date, msg_type):
    smses = doc.createElement('smses')
    smses.setAttribute('count', str(len(parsed_file)))
    smses.setAttribute('backup_set', '')
    smses.setAttribute('backup_date', str(backup_date))
    smses.setAttribute('type', 'full')
    if msg_type == "sms":
        for entry in parsed_file:
                sms = create_sms_element(doc, entry)
                smses.appendChild(sms)
    else:
        for entry in parsed_file:
                sms = create_mms_element(doc, entry)
                smses.appendChild(sms)   
    return smses

dir_tree = os.listdir(os.curdir)
files = []
for file in dir_tree:
        if not os.path.isdir(os.curdir + "/" + file) and file != "convert.py":
                files.append(file)
if len(files) <= 0:
        raise Exception("Couldn't find any files")
print("KaiOS Backup Convertor v0.2")
print('This script will convert KaiOS Backup exported SMS/MMS data to "SMS Backup & Restore" format')
print("The app is available on Android https://play.google.com/store/apps/details?id=com.riteshsahu.SMSBackupRestore&hl=en_US")
print("Select the file (in JSON format) that you want to convert")
val = 0
while True:
        try:
                for index, file in enumerate(files):
                        print(f"[{index+1}] {files[index]}")
                val = input()
                if not val.isdigit() or (int(val) < 1 or int(val) > len(files)):
                        print("Wrong input, try again..")
                else:
                        break
        except Exception as e:
                print(e)
                quit()
selected_file = files[int(val)-1]
print(f"Selected file {selected_file}")

dot_index = selected_file.rfind('.')
if dot_index == -1:
        raise Exception("Couldn't identify the extension of file")
        
extension = selected_file[dot_index + 1:]
output_file = ""
msg_type = ""

match extension:
        case "json":
                try:
                        file = open(selected_file,"r",encoding="utf8")
                        parsed_file = json.loads(file.read())
                        backup_date = int(os.path.getctime(os.curdir + "/" + selected_file) * 1000)
                        
                        if len(parsed_file) < 1:
                                quit("Got empty file!")
                        elif not "type" in parsed_file[0]:
                                quit("Please use backup files from KaiOS Backup")
                        if parsed_file[0]["type"] == "sms":
                                print("Trying to convert SMS backup file")
                                msg_type = "sms"      
                        elif parsed_file[0]["type"] == "mms":
                                print("Trying to convert MMS backup file")
                                msg_type = "mms"
                        else:
                                quit("Couldn't identify type of backup!")
                        doc = minidom.Document()
                        smses_element = create_smses_element(doc, parsed_file, backup_date, msg_type)
                        doc.appendChild(smses_element)
                        output_file = doc.toprettyxml(indent="  ", encoding='UTF-8')  
                except Exception as e:
                        print("Error happened while trying to convert the file!")
                        quit(traceback.format_exc())                                                                                                                                                                                                                                                                                                                                                                                               
        case _:
                print("File type not supported!")
                quit()

output = open(f"converted_{msg_type}.xml","wb")
output.write(output_file)
output.close()
print("The file was successfully converted!")
input("Press Enter to close the window...")