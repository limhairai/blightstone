from app.services.facebook import FacebookAPI

if __name__ == "__main__":
    fb_api = FacebookAPI(access_token="EAAJXgc4ZAgSwBOZBrpaZAwgmjf4Tmg3FG3eD4FaoPVIYvGJ80mdXoMVXtxZCG1mzj21B5qWj7ymyWuOFxZBCZBCVmiKZCa8AscOlZBGZAbUWZCZCeoQsVG1KRTy8B7ac6BrpeYIxvhxRbZAItWV0ckvugBAgQUZCZAvuvIs8ZA7OxGpxVWoUnigvTDtZALbHDUjKZArZASVWdZCvCDZAXrg5")
    try:
        result = fb_api.get_ad_accounts()
        print("SUCCESS: ", result)
    except Exception as e:
        print("ERROR: ", e) 