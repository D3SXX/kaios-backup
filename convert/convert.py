import os
import json
import xml
import datetime
from xml.dom import minidom

def create_sms_element(doc, entry):
    sms = doc.createElement('sms')

    sms.setAttribute('protocol', '0')
    sms.setAttribute('address', entry["sender"])
    sms.setAttribute('date', str(entry["timestamp"]))
    sms.setAttribute('type', '1' if entry["delivery"] == "received" else '2')
    sms.setAttribute('subject', 'null')
    sms.setAttribute('body', entry["body"].replace('"', "'"))
    sms.setAttribute('toa', 'null')
    sms.setAttribute('sc_toa', 'null')
    sms.setAttribute('service_center', 'null')
    sms.setAttribute('read', str(int(entry["read"])))
    sms.setAttribute('status', '1' if entry["deliveryTimestamp"] != '' else '0')
    sms.setAttribute('locked', '0')
    sms.setAttribute('date_sent', str(entry["sentTimestamp"]))
    sms.setAttribute('sub_id', '1')
    readable_date = datetime.datetime.fromtimestamp(int(entry["timestamp"]) / 1000).strftime("%-d %b %Y %-I.%-M.%-S %p")
    if readable_date == "":
            readable_date = datetime.datetime.fromtimestamp(int(entry["timestamp"]) / 1000).strftime("%d %b %Y %I.%M.%S %p")
    sms.setAttribute('readable_date', readable_date)
    sms.setAttribute('contact_name', '(Unknown)')

    return sms

def create_smses_element(doc, parsed_file, backup_date):
    smses = doc.createElement('smses')
    smses.setAttribute('count', str(len(parsed_file)))
    smses.setAttribute('backup_set', '')
    smses.setAttribute('backup_date', str(backup_date))
    smses.setAttribute('type', 'full')

    for entry in parsed_file:
        sms = create_sms_element(doc, entry)
        smses.appendChild(sms)

    return smses

dir_tree = os.listdir(os.curdir)
files = []
for file in dir_tree:
        if not os.path.isdir(os.curdir + "/" + file) and file != "convert.py":
                files.append(file)
if len(files) <= 0:
        raise Exception("Couldn't find any files")
print("KaiOS Backup Convertor v0.1")
print('This script will convert KaiOS Backup exported data to "SMS Backup & Restore" format')
print("The app is available on Android https://play.google.com/store/apps/details?id=com.riteshsahu.SMSBackupRestore&hl=en_US")
print("Select the file that you want to convert")
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
match extension:
        case "json":
                print(os.curdir + "/" +selected_file)
                file = open(selected_file,"r",encoding="utf8")
                parsed_file = json.loads(file.read())
                backup_date = int(os.path.getctime(os.curdir + "/" + selected_file) * 1000)
                doc = minidom.Document()
                smses_element = create_smses_element(doc, parsed_file, backup_date)
                doc.appendChild(smses_element)
                output_file = doc.toprettyxml(indent="  ", encoding='UTF-8')                                                                                                                                                                                                                                                                                                                                                                                                           

        case _:
                print("File type not supported!")
                quit()

output = open("converted_backup.xml","wb")
output.write(output_file)
output.close()
print("The file was successfully converted!")