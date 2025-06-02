import requests

url = "https://graph.facebook.com/v19.0/me/adaccounts"
params = {"access_token": "EAAJXgc4ZAgSwBOZBrpaZAwgmjf4Tmg3FG3eD4FaoPVIYvGJ80mdXoMVXtxZCG1mzj21B5qWj7ymyWuOFxZBCZBCVmiKZCa8AscOlZBGZAbUWZCZCeoQsVG1KRTy8B7ac6BrpeYIxvhxRbZAItWV0ckvugBAgQUZCZAvuvIs8ZA7OxGpxVWoUnigvTDtZALbHDUjKZArZASVWdZCvCDZAXrg5"}
headers = {"User-Agent": "Mozilla/5.0"}

try:
    response = requests.get(url, params=params, headers=headers)
    print("Status code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e) 