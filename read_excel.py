import pandas as pd
import sys
import json

file_path = "/home/moayad/Desktop/ivega/iVEGA-Assets-Needed/قائمة-المنتجات-والصور-المطلوبة.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    output = {}
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        output[sheet_name] = df.to_dict(orient='records')
    print(json.dumps(output, ensure_ascii=False, indent=2))
except Exception as e:
    print(str(e))
