"""
Otomatik GitHub Pushlayıcı (Auto Git Pusher)
==============================================
Bu script proje klasöründeki dosya değişikliklerini (kaydetmeleri) anlık izler.
Bir dosyayı kaydedip değiştirdiğinizde, birkaç saniye içinde otomatik olarak:
1. Değişen dosyaları algılar,
2. "git add" yapar,
3. Zaman damgalı açıklayıcı commit oluşturur,
4. "git push origin main" ile doğrudan GitHub'a pushlar!

Durdurmak için terminalde: Ctrl + C
"""

import subprocess
import time
from datetime import datetime
import sys
import os

# Konsol renkleri (Windows Terminal ve modern konsollar için)
class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

def run_cmd(cmd):
    """Komut çalıştırır ve çıktısını döndürür."""
    try:
        res = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return 1, "", str(e)

def get_git_status():
    """Değişen dosyaları döndürür."""
    code, out, _ = run_cmd("git status --porcelain")
    if code != 0 or not out:
        return []
    
    files = []
    for line in out.splitlines():
        line = line.strip()
        if not line:
            continue
        # Durum kodu ve dosya adı ayrımı (örn: "M public/index.html" veya "?? yeni.txt")
        parts = line.split(maxsplit=1)
        if len(parts) == 2:
            files.append(parts[1])
        else:
            files.append(line)
    return files

def main():
    # Windows konsolunda renk desteğini aç
    os.system("")
    
    print(f"\n{Colors.BOLD}{Colors.CYAN}════════════════════════════════════════════════════════════{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}   🚀 OTOMATİK GİTHUB PUSHLAYICI AKTİF{Colors.RESET}")
    print(f"{Colors.CYAN}   Klasör: {os.getcwd()}{Colors.RESET}")
    print(f"{Colors.CYAN}   Durdurmak için: Ctrl + C{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}════════════════════════════════════════════════════════════{Colors.RESET}\n")
    print(f"{Colors.YELLOW}👀 Dosya değişiklikleri dinleniyor... Herhangi bir dosyayı kaydettiğinizde anında GitHub'a aktarılacaktır.{Colors.RESET}\n")

    last_files_str = ""

    while True:
        try:
            changed_files = get_git_status()
            
            if changed_files:
                current_files_str = ",".join(sorted(changed_files))
                
                # Debounce (Kaydetmelerin tamamlanması için 2.5 saniye bekle)
                time.sleep(2.5)
                
                # Tekrar kontrol et
                latest_changed = get_git_status()
                if not latest_changed:
                    continue

                now_str = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
                file_names_short = ", ".join([os.path.basename(f) for f in latest_changed[:3]])
                if len(latest_changed) > 3:
                    file_names_short += f" ve {len(latest_changed) - 3} dosya daha"

                commit_msg = f"auto: güncellendi: {file_names_short} ({now_str})"

                print(f"[{datetime.now().strftime('%H:%M:%S')}] {Colors.YELLOW}📝 Değişiklik algılandı: {file_names_short}{Colors.RESET}")
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 📦 GitHub'a yükleniyor...")

                # 1. Git add
                code, _, err = run_cmd("git add -A")
                if code != 0:
                    print(f"{Colors.RED}❌ git add hatası: {err}{Colors.RESET}")
                    time.sleep(3)
                    continue

                # 2. Git commit
                code, _, err = run_cmd(f'git commit -m "{commit_msg}"')
                if code != 0:
                    # Bazen commit edilecek bir şey kalmamış olabilir
                    if "nothing to commit" not in err and "nothing to commit" not in _:
                        print(f"{Colors.RED}❌ git commit hatası: {err}{Colors.RESET}")
                        time.sleep(3)
                        continue

                # 3. Git push
                code, out, err = run_cmd("git push origin main")
                if code == 0:
                    print(f"{Colors.GREEN}{Colors.BOLD}✅ [{datetime.now().strftime('%H:%M:%S')}] Başarıyla GitHub'a PUSHLANDI!{Colors.RESET}")
                    print(f"{Colors.GREEN}   Commit: \"{commit_msg}\"{Colors.RESET}\n")
                else:
                    print(f"{Colors.RED}❌ git push hatası: {err or out}{Colors.RESET}\n")

            time.sleep(1.5)

        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}👋 Otomatik pushlayıcı durduruldu.{Colors.RESET}")
            sys.exit(0)
        except Exception as e:
            print(f"{Colors.RED}Beklenmeyen hata: {e}{Colors.RESET}")
            time.sleep(3)

if __name__ == "__main__":
    main()
