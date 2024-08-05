# KaiOS Backup Converter

## Description

The converter transforms KaiOS Backup SMS and MMS data into a format compatible with the "SMS Backup & Restore" app ([Google Play Store Link](https://play.google.com/store/apps/details?id=com.riteshsahu.SMSBackupRestore&hl=en_US)).

## How to use

There are two ways to use the script:

- Executable file convert.exe: Launch the executable file located in this folder.
- Source script convert.py: Run the script found in the src/ folder.

Upon launch, the script will scan the current directory for files and prompt you to select the file you want to convert by typing the corresponding digit (index) of the file.

Note! If you want to convert MMS data put "MMS_Content" folder in the same directory where the script is located, otherwise it will error.

The output will be a file named "converted_(type).xml," which can then be used with the Android app.

## Source code

See [src/convert.py](./src/convert.py) for the source code.

## Notes

- The converter currently supports only JSON files.

- The Android application mentioned and its author are not affiliated with me or with KaiOS Backup.