# TVF Profesyonel Ligler (Pro Volley)

Bu proje TVF Profesyonel Ligleri için bağımsız web platformudur:
- **Vodafone Sultanlar Ligi** (`/sultanlar-ligi`)
- **Arabica Coffee House Kadınlar Voleybol 1. Ligi** (`/kadinlar-1-ligi`)
- **TVF Kadınlar 2. Ligi** (`/kadinlar-2-ligi`)

## 🚀 Lig Kazıma ve Senkronizasyon Komutları

```bash
# Tüm profesyonel ligleri çek
python scripts/scrape_pro_leagues.py --all

# Sultanlar Ligi
python scripts/scrape_sultanlar_ligi.py

# Kadınlar 1. Ligi
python scripts/scrape_kadinlar_1_lig.py

# Kadınlar 2. Ligi
python scripts/scrape_kadinlar_2_lig.py

# Volleybox Maç Senkronizasyonu
python scripts/sync_volleybox_matches.py
```

## 💻 Geliştirme

```bash
npm install
npm run dev
```
