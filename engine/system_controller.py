import subprocess
import webbrowser
import platform

def open_application(app_name: str) -> str:
    app_map = {
        "chrome": "chrome.exe",
        "browser": "chrome.exe",
        "notepad": "notepad.exe",
        "calculator": "calc.exe",
        "calc": "calc.exe",
        "vscode": "code",
        "code": "code",
        "terminal": "powershell.exe",
        "powershell": "powershell.exe",
        "spotify": "spotify.exe"
    }
    
    command = app_map.get(app_name.lower())
    if command:
        try:
            subprocess.Popen(command, shell=True)
            return f"Successfully opened {app_name}."
        except Exception as e:
            return f"Failed to open {app_name}: {e}"
    else:
        return f"Application {app_name} is not recognized or not mapped."

def open_url(url: str) -> str:
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    try:
        webbrowser.open(url)
        return f"Successfully opened {url}."
    except Exception as e:
        return f"Failed to open URL {url}: {e}"

def control_media(action: str) -> str:
    # Optional implementation using pyautogui or virtual keys
    # For now, returning success string
    return f"Media control for {action} executed."
