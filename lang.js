/* ============================================================
   CHECKPOINT — Language / Localisation System
   Supports: en (English), tr (Turkish)
   window.t(key, params?)  — translate with optional {param} substitution
   window.applyI18n()      — update all [data-i18n] DOM elements
   window.setLanguage(lc)  — switch language and refresh UI
   ============================================================ */
'use strict';

// ─────────────────────────────────────────────────────────────
// ENGLISH
// ─────────────────────────────────────────────────────────────
const LANG_EN = {
  // Topbar
  'logo':                  '■ CHECKPOINT',
  'topbar.day':            'Day',
  'topbar.time':           'Time',
  'topbar.processed':      'Processed',
  'topbar.errors':         'Errors',
  'topbar.balance':        'Balance',
  'topbar.score':          'Score',
  'topbar.streak':         'STREAK:',
  'topbar.phantom':        '⬡ PHANTOM',
  'alert.security':        '⚠ SECURITY ALERT — ALL OFFICERS REMAIN AT POSTS',

  // Left panel headers
  'panel.passenger':       'Current Passenger',
  'panel.queue':           'Queue',
  'panel.bulletin':        '■ Today\'s Bulletin',
  'panel.family':          'Family',
  'panel.moral':           'Moral Profile',
  'moral.compassion':      'COMPASSION',
  'moral.loyalty':         'LOYALTY',
  'moral.corruption':      'CORRUPTION',
  'photo.noimg':           'NO IMG',
  'queue.awaiting':        'Awaiting passenger',

  // Right panel
  'panel.biometrics':      'Biometric Verification',
  'panel.database':        'Database Checks',
  'panel.flags':           'Flags & Notes',
  'bio.face':              'Facial Recognition',
  'bio.finger':            'Fingerprint Scan',
  'bio.chip':              'RFID Chip Read',
  'bio.waiting':           'WAITING...',
  'bio.scanning':          'SCANNING...',
  'bio.matchOk':           'MATCH {score}%',
  'bio.matchFail':         'LOW MATCH {score}%',
  'bio.fingerFail':        'FAIL {score}%',
  'db.interpol':           'Interpol Watchlist',
  'db.national':           'National Blacklist',
  'db.visa':               'Visa Validity',
  'db.ees':                'EES — Entry/Exit',
  'db.flight':             'Flight Record',

  // Action bar
  'btn.approve':           '✓ Approve',
  'btn.deny':              '✗ Deny',
  'btn.detain':            '▲ Detain',
  'btn.flag':              '⚑ Flag',
  'btn.rules':             '≡ Rules',
  'btn.settings':          '⚙ Settings',
  'action.noPassenger':    'No active passenger',
  'action.scanning':       'Scanning...',
  'action.decide':         'Make a decision',
  'action.approved':       'APPROVED — Gate opened',
  'action.denied':         'DENIED — Passenger redirected',
  'action.detained':       'DETAINED — Security notified',
  'action.flagged':        'FLAGGED — Secondary inspection',

  // Document tabs
  'tab.passport':          'Passport',
  'tab.visa':              'Visa',
  'tab.boarding':          'Boarding Pass',
  'tab.chip':              'RFID Chip',
  'tab.note':              '⬡ NOTE',
  'tab.envelope':          '✉ ENVELOPE',

  // Passport fields
  'doc.passport.title':    'Travel Document',
  'doc.chip.title':        'RFID Chip — LDS Data',
  'doc.visa.title':        'Entry Visa',
  'doc.boarding.title':    'Boarding Pass',
  'doc.phantom.title':     'ENCRYPTED NOTE — SOURCE UNKNOWN',
  'doc.phantom.footer':    '⬡ PHANTOM — This note was not part of the official documentation.',
  'doc.envelope.title':    'NON-DOCUMENT ITEM',
  'doc.envelope.body':     'A sealed envelope, approximately 12×8cm.\nNot part of the official document set.\nPassed through the slot alongside the passport without comment.',
  'doc.envelope.warning':  'Contents unknown until opened. Accepting non-document items may constitute a violation of conduct regulations.',
  'field.surname':         'Surname',
  'field.givenNames':      'Given Names',
  'field.nationality':     'Nationality',
  'field.dob':             'Date of Birth',
  'field.sex':             'Sex',
  'field.height':          'Height',
  'field.weight':          'Weight',
  'field.issuingCity':     'Issuing City',
  'field.passportNo':      'Passport No.',
  'field.expiration':      'Expiration',
  'field.mrz':             'Machine Readable Zone',
  'field.male':            'Male',
  'field.female':          'Female',
  'field.chipName':        'Name (chip)',
  'field.chipDob':         'DOB (chip)',
  'field.chipNo':          'Passport No.',
  'field.chipExpiry':      'Expiry (chip)',
  'field.biohash':         'Biohash',
  'field.chipStatus':      'Chip Status',
  'chip.ok':               'Chip integrity: OK',
  'chip.mismatch':         'CHIP DATA CONFLICT DETECTED',
  'chip.verified':         'VERIFIED',
  'chip.mismatched':       'MISMATCH',
  'field.visaType':        'Visa Type',
  'field.visaNo':          'Visa Number',
  'field.visaIssued':      'Issued',
  'field.visaExpires':     'Expires',
  'field.visaPurpose':     'Purpose',
  'field.visaIssuedBy':    'Issued By',
  'field.visaStatus':      'Status',
  'visa.valid':            'VALID',
  'visa.expired':          'EXPIRED',
  'field.passenger':       'Passenger',
  'field.flight':          'Flight',
  'field.route':           'Route',
  'field.date':            'Date',
  'field.seat':            'Seat',
  'boarding.mismatch':     '⚠ Name on boarding pass does not match passport',

  // Anomaly descriptions
  'anomaly.expired_passport':        'Passport expired {date}',
  'anomaly.chip_mismatch':           'RFID chip data does not match printed passport fields',
  'anomaly.face_mismatch':           'Low facial match: {score}% (threshold: 80%)',
  'anomaly.missing_visa':            'No valid visa — entry permit required for this nationality',
  'anomaly.expired_visa':            'Visa expired {date}',
  'anomaly.watchlist_hit':           'Interpol watchlist match — notify security',
  'anomaly.ees_overstay':            'EES record shows prior overstay — no registered exit',
  'anomaly.boarding_name_mismatch':  'Boarding pass name does not match passport',
  'anomaly.no_passport':            'No travel document presented — entry cannot be processed',
  'anomaly.no_boarding_pass':       'No boarding pass presented — passenger claims lost or stolen',

  // Notes / flags
  'notes.allClear':        'All checks passed. No issues detected.',
  'flag.auditor':          '⚠ Auditor Badge #{badge} presented alongside passport',
  'flag.redThread':        '⚠ RED THREAD visible on passport lanyard',
  'flag.threat':           '⚠ THREAT ASSESSMENT: KNOWN SUSPECT — VERIFY ALL DATA',
  'flag.envelope':         '⚠ Non-document item passed through slot — envelope',
  'flag.phantom':          '⬡ PHANTOM: This individual is a faction target',

  // Bribe
  'bribe.title':           '— ENVELOPE —',
  'bribe.accept':          'Accept it quietly',
  'bribe.refuse':          'Return it. Say nothing.',
  'bribe.accepted':        '⚠ Bribe accepted — +$150 | Corruption increased',
  'bribe.refused':         'Bribe refused. He takes it back without reaction.',

  // Terrorist
  'terrorist.caught':      '★ TERRORIST APPREHENDED — Bonus: +$25',

  // Family
  'family.healthy':        'HEALTHY',
  'family.hungry':         'HUNGRY',
  'family.cold':           'COLD',
  'family.sick':           'SICK',
  'family.critical':       'CRITICAL',
  'family.deceased':       'DECEASED',

  // Penalty warning
  'penalty.title':         '⚠ INCORRECT DECISION',
  'penalty.flagged':       'Your decision has been flagged by the system.',
  'penalty.correct':       'The correct action was:',
  'penalty.reason':        'Reason:',
  'penalty.none':          'No violations found — should have approved.',
  'penalty.amount':        'Penalty: -${amount}',
  'penalty.ack':           'Acknowledged',

  // Story
  'story.response':        'YOUR RESPONSE:',
  'story.encountered':     'ENCOUNTERED {n}×',
  'story.dismiss':         'Dismiss',
  'phantom.firstContact':  '⬡ PHANTOM — FIRST CONTACT',
  'phantom.trusted':       'TRUSTED',
  'phantom.watching':      'WATCHING',
  'phantom.cautious':      'CAUTIOUS',

  // Expense summary
  'expense.title':         'HOUSEHOLD EXPENSES',
  'expense.remaining':     'Remaining after expenses',
  'expense.food':          'Food',
  'expense.heat':          'Heating',
  'expense.medicine':      'Medicine',
  'expense.foodConseq':    'Family goes hungry if skipped',
  'expense.heatConseq':    'Family gets cold if skipped',
  'expense.medConseq':     'Sick members worsen without it',
  'expense.needed':        '— NEEDED',

  // Day summary
  'summary.title':         'END OF DAY',
  'summary.report':        'DAY {day} — SHIFT REPORT',
  'summary.processed':     'Processed',
  'summary.correct':       'Correct',
  'summary.errors':        'Errors',
  'summary.warnings':      'Warnings',
  'summary.earnings':      'EARNINGS',
  'summary.salary':        'Salary earned',
  'summary.penalties':     'Penalties',
  'summary.balance':       'Balance',
  'summary.score':         'SCORE',
  'summary.bestStreak':    'Best streak',
  'summary.confirm':       'Confirm & Sleep',
  'summary.family':        'FAMILY',

  // Bulletin board
  'bulletin.activeRules':  'DAY {day} ACTIVE RULES',
  'bulletin.visa':         'Visa:',
  'bulletin.required':     'Required',
  'bulletin.no':           'No',
  'bulletin.chip':         'Chip:',
  'bulletin.mandatory':    'Mandatory',
  'bulletin.optional':     'Optional',
  'bulletin.banned':       '⚠ BANNED: {nations}',
  'bulletin.threat':       '⚠ THREAT LEVEL: ELEVATED',
  'bulletin.interpol':     '▲ Interpol hits: DETAIN',

  // Day bulletin modal
  'modal.ministry':        'MINISTRY OF ADMISSION',
  'modal.ops':             'DAILY OPERATIONS BULLETIN',
  'modal.update':          'REGULATORY UPDATE — DAY {day}',
  'modal.bannedEntry':     '⚠ ENTRY BANNED: {nations}',
  'modal.threatElev':      '⚠ THREAT LEVEL ELEVATED — All entrants subject to secondary biometric check',
  'modal.interpolDetain':  '▲ Interpol hits now mandate DETAIN (not deny)',
  'modal.overstayDetain':  '▲ EES overstay now mandates DETAIN',
  'modal.comply':          'Officer compliance is mandatory. — CHECKPOINT AUTHORITY',
  'modal.ack':             'Acknowledged — Begin Shift',
  'modal.missingDoc':      'MISSING DOCUMENT',

  // Rulebook
  'rules.title':           'DAILY REGULATIONS',
  'rules.header':          'DAY {day} — CURRENT REGULATIONS',
  'rules.permitted':       'Permitted nations',
  'rules.allNations':      'All nations',
  'rules.visa':            'Visa required',
  'rules.chip':            'Chip verification',
  'rules.chipMand':        'MANDATORY',
  'rules.chipOpt':         'Optional',
  'rules.banned':          'Banned nations',
  'rules.bannedNone':      'None',
  'rules.interpol':        'Interpol hits',
  'rules.interpolDetain':  'DETAIN (mandatory)',
  'rules.interpolDeny':    'DENY',
  'rules.ees':             'EES overstay',
  'rules.eesDetain':       'DETAIN',
  'rules.eesDeny':         'DENY',
  'rules.threat':          'Threat level',
  'rules.threatElev':      'ELEVATED ⚠',
  'rules.yes':             'YES',
  'rules.no':              'NO',
  'rules.close':           'Close',

  // Welcome / Init
  'init.title':            'CHECKPOINT — BIOMETRIC BORDER CONTROL',
  'init.welcome':          'Welcome, Officer.',
  'init.desc':             'Process each passenger by reviewing their documents and biometric scan results. Make the correct call — your salary depends on it. So does your family.',
  'init.saveFound':        '■ SAVE DATA FOUND — Day {day}',
  'init.continue':         '▶ Continue — Day {day}',
  'init.newGame':          'New Game',
  'init.begin':            'Begin Shift — Day 1',

  // Game over
  'gameover.title':        '— GAME OVER —',
  'gameover.family':       'Your family did not survive.',
  'gameover.score':        'Final score:',
  'gameover.days':         'Days completed:',
  'gameover.newGame':      'New Game',

  // Ending
  'ending.unlocked':       '— ENDING UNLOCKED —',
  'ending.newGame':        'New Game',

  // Settings
  'settings.title':        'DISPLAY SETTINGS',
  'settings.resolution':   'Resolution',
  'settings.quality':      'Visual Quality',
  'settings.qualityLow':   'Low (no animations)',
  'settings.qualityMed':   'Medium',
  'settings.qualityHigh':  'High (glow effects)',
  'settings.crt':          'CRT Scanline Effect',
  'settings.crtOn':        'On',
  'settings.crtOff':       'Off',
  'settings.fontSize':     'Font Size',
  'settings.fontSm':       'Small',
  'settings.fontMd':       'Medium',
  'settings.fontLg':       'Large',
  'settings.volume':       'Sound Volume',
  'settings.language':     'Language',
  'settings.apply':        'Apply',
  'settings.close':        'Close',
  'settings.resNote':      'Requires Electron desktop app to resize window.',

  // Titlebar
  'titlebar.title':        'CHECKPOINT',

  // Behavior descriptions (generated per passenger)
  'behavior.critical1':    'Extremely nervous. Avoids eye contact. Hands trembling.',
  'behavior.critical2':    'Aggressive when asked to wait. Insists everything is fine.',
  'behavior.high1':        'Slightly anxious. Keeps looking toward the gate.',
  'behavior.high2':        'Over-confident. Rushes you to stamp quickly.',
  'behavior.high3':        'Fidgeting with passport. Asked twice if something is wrong.',
  'behavior.normal1':      'Calm. Professional. Appears a routine traveller.',
  'behavior.normal2':      'Tired. Yawning. Long-haul flight.',
  'behavior.normal3':      'Tourist. Smiling. Has a camera bag.',

  // DB display values
  'db.querying':           'QUERYING...',
  'db.val.clear':          'CLEAR',
  'db.val.confirmed':      'CONFIRMED',
  'db.val.na':             'N/A',
  'db.val.noEntry':        'NO PRIOR ENTRY',
  'db.val.pending':        'PENDING',
  'db.val.mismatch':       'MISMATCH',
  'db.val.expired':        'EXPIRED',
  'db.val.missing':        'MISSING',
  'db.val.hit':            'HIT',
  'db.val.overstay':       'OVERSTAY — LAST EXIT MISSING',

  // Missing document
  'tab.missing':           '✕ MISSING',
  'flag.missingVisa':      '⚠ VİZE BULUNAMADI — Visa is mandatory for this nationality',
  'flag.noPassport':       '⚠ NO PASSPORT — Entry cannot be processed without a travel document',
  'flag.missingBoarding':  '⚠ BOARDING PASS MISSING — Passenger claims lost or stolen',
  'dialogue.wherePassport':'Where is your passport?',
  'dialogue.whereVisa':    'Where is your visa?',
  'passenger.forgot':      '"I left it at the hotel."',
  'passenger.stolen':      '"It was stolen."',
  'passenger.didntKnow':   '"I did not think I needed one."',

  // Micro-events
  'micro.bribeOffer':      'Passenger slides a sealed envelope through the slot with their documents.',
  'micro.diplomatic':      'Passenger claims diplomatic immunity and requests expedited processing.',
  'micro.lostBoarding':    'Passenger has only their passport — boarding pass lost or unavailable.',
  'micro.nicknameMismatch':'Name on boarding pass appears to be a nickname or abbreviated form.',
  'micro.visiblyIll':      'Passenger appears unwell. Coughing. Flushed skin.',
  'micro.cryingChild':     'Passenger has a young child. Child is distressed. Passenger begs entry.',

  // ANIMUS
  'animus.tab':            '◈ ANİMUS',
  'animus.symbol':         '◈',

  // Queue badges
  'queue.ok':              'OK',
  'queue.err':             'ERR',
};

// ─────────────────────────────────────────────────────────────
// TURKISH
// ─────────────────────────────────────────────────────────────
const LANG_TR = {
  // Topbar
  'logo':                  '■ KONTROL NOKTASI',
  'topbar.day':            'Gün',
  'topbar.time':           'Saat',
  'topbar.processed':      'İşlenen',
  'topbar.errors':         'Hata',
  'topbar.balance':        'Bakiye',
  'topbar.score':          'Puan',
  'topbar.streak':         'SERİ:',
  'topbar.phantom':        '⬡ HAYALET',
  'alert.security':        '⚠ GÜVENLİK ALARMI — TÜM MEMURLAR GÖREVLERİNDE KALSIN',

  // Left panel headers
  'panel.passenger':       'Mevcut Yolcu',
  'panel.queue':           'Sıra',
  'panel.bulletin':        '■ Günün Bülteni',
  'panel.family':          'Aile',
  'panel.moral':           'Ahlaki Profil',
  'moral.compassion':      'MERHAMETİ',
  'moral.loyalty':         'SADAKATI',
  'moral.corruption':      'YOLSUZLUK',
  'photo.noimg':           'FOTOĞRAF YOK',
  'queue.awaiting':        'Yolcu bekleniyor',

  // Right panel
  'panel.biometrics':      'Biyometrik Doğrulama',
  'panel.database':        'Veritabanı Sorguları',
  'panel.flags':           'Uyarılar ve Notlar',
  'bio.face':              'Yüz Tanıma',
  'bio.finger':            'Parmak İzi Tarama',
  'bio.chip':              'RFID Çip Okuma',
  'bio.waiting':           'BEKLENİYOR...',
  'bio.scanning':          'TARANIOR...',
  'bio.matchOk':           'EŞLEŞİYOR %{score}',
  'bio.matchFail':         'DÜŞÜK EŞLEŞİ %{score}',
  'bio.fingerFail':        'BAŞARISIZ %{score}',
  'db.interpol':           'Interpol Listesi',
  'db.national':           'Ulusal Kara Liste',
  'db.visa':               'Vize Geçerliliği',
  'db.ees':                'EES — Giriş/Çıkış',
  'db.flight':             'Uçuş Kaydı',

  // Action bar
  'btn.approve':           '✓ Onayla',
  'btn.deny':              '✗ Reddet',
  'btn.detain':            '▲ Gözaltı',
  'btn.flag':              '⚑ İşaretle',
  'btn.rules':             '≡ Kurallar',
  'btn.settings':          '⚙ Ayarlar',
  'action.noPassenger':    'Aktif yolcu yok',
  'action.scanning':       'Taranıyor...',
  'action.decide':         'Karar verin',
  'action.approved':       'ONAYLANDI — Kapı açıldı',
  'action.denied':         'REDDEDİLDİ — Yolcu yönlendirildi',
  'action.detained':       'GÖZALTINA ALINDI — Güvenlik bildirildi',
  'action.flagged':        'İŞARETLENDİ — İkincil inceleme',

  // Document tabs
  'tab.passport':          'Pasaport',
  'tab.visa':              'Vize',
  'tab.boarding':          'Biniş Kartı',
  'tab.chip':              'RFID Çip',
  'tab.note':              '⬡ NOT',
  'tab.envelope':          '✉ ZARF',

  // Passport fields
  'doc.passport.title':    'Seyahat Belgesi',
  'doc.chip.title':        'RFID Çip — LDS Verisi',
  'doc.visa.title':        'Giriş Vizesi',
  'doc.boarding.title':    'Biniş Kartı',
  'doc.phantom.title':     'ŞİFRELİ NOT — KAYNAK BİLİNMİYOR',
  'doc.phantom.footer':    '⬡ HAYALET — Bu not resmi belge setinin parçası değildi.',
  'doc.envelope.title':    'BELGE OLMAYAN EŞYA',
  'doc.envelope.body':     'Yaklaşık 12×8 cm boyutunda kapalı bir zarf.\nResmi belge setinin parçası değil.\nPasaportla birlikte yuvadan sessizce geçirildi.',
  'doc.envelope.warning':  'Açılana kadar içeriği bilinmez. Belge olmayan eşyaların kabulü yönetmeliklere aykırı olabilir.',
  'field.surname':         'Soyadı',
  'field.givenNames':      'Ad(lar)',
  'field.nationality':     'Uyruk',
  'field.dob':             'Doğum Tarihi',
  'field.sex':             'Cinsiyet',
  'field.height':          'Boy',
  'field.weight':          'Kilo',
  'field.issuingCity':     'Düzenleyen Şehir',
  'field.passportNo':      'Pasaport No.',
  'field.expiration':      'Son Kullanma',
  'field.mrz':             'Makine Okuma Bölgesi',
  'field.male':            'Erkek',
  'field.female':          'Kadın',
  'field.chipName':        'Ad (çip)',
  'field.chipDob':         'D.T. (çip)',
  'field.chipNo':          'Pasaport No.',
  'field.chipExpiry':      'Son Kul. (çip)',
  'field.biohash':         'Biohash',
  'field.chipStatus':      'Çip Durumu',
  'chip.ok':               'Çip bütünlüğü: Geçerli',
  'chip.mismatch':         'ÇİP VERİSİ ÇAKIŞMASI TESPİT EDİLDİ',
  'chip.verified':         'DOĞRULANDI',
  'chip.mismatched':       'ÇAKIŞMA',
  'field.visaType':        'Vize Türü',
  'field.visaNo':          'Vize Numarası',
  'field.visaIssued':      'Düzenleme Tarihi',
  'field.visaExpires':     'Son Geçerlilik',
  'field.visaPurpose':     'Amaç',
  'field.visaIssuedBy':    'Düzenleyen',
  'field.visaStatus':      'Durum',
  'visa.valid':            'GEÇERLİ',
  'visa.expired':          'SÜRESİ DOLMUŞ',
  'field.passenger':       'Yolcu',
  'field.flight':          'Uçuş',
  'field.route':           'Güzergah',
  'field.date':            'Tarih',
  'field.seat':            'Koltuk',
  'boarding.mismatch':     '⚠ Biniş kartındaki isim pasaportla eşleşmiyor',

  // Anomaly descriptions
  'anomaly.expired_passport':       'Pasaport süresi dolmuş: {date}',
  'anomaly.chip_mismatch':          'RFID çip verisi basılı pasaport alanlarıyla eşleşmiyor',
  'anomaly.face_mismatch':          'Düşük yüz eşleşmesi: %{score} (eşik: %80)',
  'anomaly.missing_visa':           'Geçerli vize yok — bu uyruk için giriş izni gereklidir',
  'anomaly.expired_visa':           'Vize süresi dolmuş: {date}',
  'anomaly.watchlist_hit':          'Interpol izleme listesi eşleşmesi — güvenliği bilgilendirin',
  'anomaly.ees_overstay':           'EES kaydı önceki aşımı gösteriyor — kayıtlı çıkış yok',
  'anomaly.boarding_name_mismatch': 'Biniş kartındaki isim pasaportla eşleşmiyor',
  'anomaly.no_passport':           'Seyahat belgesi sunulmadı — giriş işlemi gerçekleştirilemiyor',
  'anomaly.no_boarding_pass':      'Biniş kartı sunulmadı — yolcu kaybolduğunu veya çalındığını iddia ediyor',

  // Notes / flags
  'notes.allClear':        'Tüm kontroller geçti. Sorun tespit edilmedi.',
  'flag.auditor':          '⚠ Denetçi Rozeti #{badge} pasaportla birlikte sunuldu',
  'flag.redThread':        '⚠ Pasaport kordonunda KIRMIZI İP görülüyor',
  'flag.threat':           '⚠ TEHDİT DEĞERLENDİRMESİ: BİLİNEN ŞÜPHELI — TÜM VERİLERİ DOĞRULAYIN',
  'flag.envelope':         '⚠ Yuvadan belge olmayan bir eşya geçirildi — zarf',
  'flag.phantom':          '⬡ HAYALET: Bu kişi bir fraksiyon hedefidir',

  // Bribe
  'bribe.title':           '— ZARF —',
  'bribe.accept':          'Sessizce kabul et',
  'bribe.refuse':          'İade et. Hiçbir şey söyleme.',
  'bribe.accepted':        '⚠ Rüşvet kabul edildi — +$150 | Yolsuzluk arttı',
  'bribe.refused':         'Rüşvet reddedildi. Tepkisizce geri alıyor.',

  // Terrorist
  'terrorist.caught':      '★ TERÖRİST YAKALANDI — Bonus: +$25',

  // Family
  'family.healthy':        'SAĞLIKLI',
  'family.hungry':         'AÇ',
  'family.cold':           'ÜŞÜYOR',
  'family.sick':           'HASTA',
  'family.critical':       'KRİTİK',
  'family.deceased':       'HAYATINI KAYBETTİ',

  // Penalty warning
  'penalty.title':         '⚠ YANLIŞ KARAR',
  'penalty.flagged':       'Kararınız sistem tarafından işaretlendi.',
  'penalty.correct':       'Doğru eylem şuydu:',
  'penalty.reason':        'Sebep:',
  'penalty.none':          'İhlal bulunmadı — onaylanmalıydı.',
  'penalty.amount':        'Ceza: -${amount}',
  'penalty.ack':           'Anlaşıldı',

  // Story
  'story.response':        'YANITINIZ:',
  'story.encountered':     '{n}× KARŞILAŞILDI',
  'story.dismiss':         'Kapat',
  'phantom.firstContact':  '⬡ HAYALET — İLK TEMAS',
  'phantom.trusted':       'GÜVENİLİR',
  'phantom.watching':      'İZLİYOR',
  'phantom.cautious':      'TEMKİNLİ',

  // Expense summary
  'expense.title':         'HANE GİDERLERİ',
  'expense.remaining':     'Giderlerden sonra kalan',
  'expense.food':          'Yiyecek',
  'expense.heat':          'Isınma',
  'expense.medicine':      'İlaç',
  'expense.foodConseq':    'Geçilirse aile aç kalır',
  'expense.heatConseq':    'Geçilirse aile üşür',
  'expense.medConseq':     'Hasta üyeler iyileşemez',
  'expense.needed':        '— GEREKLİ',

  // Day summary
  'summary.title':         'GÜN SONU',
  'summary.report':        'GÜN {day} — VARDİYA RAPORU',
  'summary.processed':     'İşlenen',
  'summary.correct':       'Doğru',
  'summary.errors':        'Hata',
  'summary.warnings':      'Uyarılar',
  'summary.earnings':      'KAZANÇ',
  'summary.salary':        'Maaş kazanıldı',
  'summary.penalties':     'Cezalar',
  'summary.balance':       'Bakiye',
  'summary.score':         'PUAN',
  'summary.bestStreak':    'En iyi seri',
  'summary.confirm':       'Onayla & Uyu',
  'summary.family':        'AİLE',

  // Bulletin board
  'bulletin.activeRules':  'GÜN {day} AKTİF KURALLAR',
  'bulletin.visa':         'Vize:',
  'bulletin.required':     'Zorunlu',
  'bulletin.no':           'Hayır',
  'bulletin.chip':         'Çip:',
  'bulletin.mandatory':    'Zorunlu',
  'bulletin.optional':     'İsteğe Bağlı',
  'bulletin.banned':       '⚠ YASAKLI: {nations}',
  'bulletin.threat':       '⚠ TEHDİT SEVİYESİ: YÜKSEK',
  'bulletin.interpol':     '▲ Interpol: GÖZALTINA AL',

  // Day bulletin modal
  'modal.ministry':        'GEÇİŞ BAKANLIĞI',
  'modal.ops':             'GÜNLÜK OPERASYON BÜLTENİ',
  'modal.update':          'MEVZUAT GÜNCELLEMESİ — GÜN {day}',
  'modal.bannedEntry':     '⚠ GİRİŞ YASAKLI: {nations}',
  'modal.threatElev':      '⚠ TEHDİT SEVİYESİ YÜKSEK — Tüm giriş yapanlar ikincil biyometrik kontrole tabidir',
  'modal.interpolDetain':  '▲ Interpol eşleşmeleri artık GÖZALTINI zorunlu kılıyor (red değil)',
  'modal.overstayDetain':  '▲ EES aşımı artık GÖZALTINI zorunlu kılıyor',
  'modal.comply':          'Memur uyumu zorunludur. — KONTROL NOKTASI YETKİLİSİ',
  'modal.ack':             'Anlaşıldı — Vardiyaya Başla',
  'modal.missingDoc':      'EKSİK BELGE',

  // Rulebook
  'rules.title':           'GÜNLÜK YÖNETMELİK',
  'rules.header':          'GÜN {day} — MEVCUT DÜZENLEMELER',
  'rules.permitted':       'İzin verilen uyruklar',
  'rules.allNations':      'Tüm uyruklar',
  'rules.visa':            'Vize zorunlu',
  'rules.chip':            'Çip doğrulama',
  'rules.chipMand':        'ZORUNLU',
  'rules.chipOpt':         'İsteğe Bağlı',
  'rules.banned':          'Yasaklı uyruklar',
  'rules.bannedNone':      'Yok',
  'rules.interpol':        'Interpol eşleşmeleri',
  'rules.interpolDetain':  'GÖZALTINA AL (zorunlu)',
  'rules.interpolDeny':    'REDDET',
  'rules.ees':             'EES aşımı',
  'rules.eesDetain':       'GÖZALTINA AL',
  'rules.eesDeny':         'REDDET',
  'rules.threat':          'Tehdit seviyesi',
  'rules.threatElev':      'YÜKSEK ⚠',
  'rules.yes':             'EVET',
  'rules.no':              'HAYIR',
  'rules.close':           'Kapat',

  // Welcome / Init
  'init.title':            'KONTROL NOKTASI — BİYOMETRİK SINIR KONTROLÜ',
  'init.welcome':          'Hoş geldiniz, Memur.',
  'init.desc':             'Her yolcuyu belgelerini ve biyometrik tarama sonuçlarını inceleyerek işleyin. Doğru kararı verin — maaşınız buna bağlı. Aileniz de.',
  'init.saveFound':        '■ KAYIT VERİSİ BULUNDU — Gün {day}',
  'init.continue':         '▶ Devam Et — Gün {day}',
  'init.newGame':          'Yeni Oyun',
  'init.begin':            'Vardiyaya Başla — Gün 1',

  // Game over
  'gameover.title':        '— OYUN BİTTİ —',
  'gameover.family':       'Aileniz hayatta kalamadı.',
  'gameover.score':        'Son puan:',
  'gameover.days':         'Tamamlanan günler:',
  'gameover.newGame':      'Yeni Oyun',

  // Ending
  'ending.unlocked':       '— SON AÇILDI —',
  'ending.newGame':        'Yeni Oyun',

  // Settings
  'settings.title':        'GÖRÜNTÜ AYARLARI',
  'settings.resolution':   'Çözünürlük',
  'settings.quality':      'Görsel Kalite',
  'settings.qualityLow':   'Düşük (animasyon yok)',
  'settings.qualityMed':   'Orta',
  'settings.qualityHigh':  'Yüksek (ışıma efektleri)',
  'settings.crt':          'CRT Tarama Çizgisi',
  'settings.crtOn':        'Açık',
  'settings.crtOff':       'Kapalı',
  'settings.fontSize':     'Yazı Tipi Boyutu',
  'settings.fontSm':       'Küçük',
  'settings.fontMd':       'Orta',
  'settings.fontLg':       'Büyük',
  'settings.volume':       'Ses Seviyesi',
  'settings.language':     'Dil',
  'settings.apply':        'Uygula',
  'settings.close':        'Kapat',
  'settings.resNote':      'Pencereyi yeniden boyutlandırmak için Electron masaüstü uygulaması gereklidir.',

  // Titlebar
  'titlebar.title':        'KONTROL NOKTASI',

  // Behavior descriptions
  'behavior.critical1':    'Son derece gergin. Göz temasından kaçınıyor. Elleri titriyor.',
  'behavior.critical2':    'Beklenmesi istendiğinde saldırgan. Her şeyin yolunda olduğunu ısrarla savunuyor.',
  'behavior.high1':        'Biraz endişeli. Sürekli kapıya bakıyor.',
  'behavior.high2':        'Aşırı kendinden emin. Damgalamanızı acele ettiriyor.',
  'behavior.high3':        'Pasaportuyla uğraşıyor. Bir şeylerin yanlış gidip gitmediğini iki kez sordu.',
  'behavior.normal1':      'Sakin. Profesyonel. Rutin bir yolcu görünümünde.',
  'behavior.normal2':      'Yorgun. Esniyor. Uzun mesafeli uçuş.',
  'behavior.normal3':      'Turist. Gülümsüyor. Kamera çantası var.',

  // DB display values
  'db.querying':           'SORGULANIIYOR...',
  'db.val.clear':          'TEMİZ',
  'db.val.confirmed':      'ONAYLANDI',
  'db.val.na':             'YOK',
  'db.val.noEntry':        'ÖNCEKİ GİRİŞ YOK',
  'db.val.pending':        'BEKLİYOR',
  'db.val.mismatch':       'ÇAKIŞMA',
  'db.val.expired':        'SÜRESİ DOLMUŞ',
  'db.val.missing':        'EKSİK',
  'db.val.hit':            'EŞLEŞME',
  'db.val.overstay':       'AŞIM — SON ÇIKIŞ KAYDI YOK',

  // Missing document
  'tab.missing':           '✕ EKSİK',
  'flag.missingVisa':      '⚠ VİZE BULUNAMADI — Bu uyruk için vize zorunludur',
  'flag.noPassport':       '⚠ PASAPORT YOK — Seyahat belgesi olmadan işlem yapılamaz',
  'flag.missingBoarding':  '⚠ BİNİŞ KARTI EKSİK — Yolcu kaybolduğunu veya çalındığını iddia ediyor',
  'dialogue.wherePassport':'Pasaportunuz nerede?',
  'dialogue.whereVisa':    'Vizeniz nerede?',
  'passenger.forgot':      '"Otelde unutdum."',
  'passenger.stolen':      '"Çalındı."',
  'passenger.didntKnow':   '"Gerek olmadığını düşündüm."',

  // Micro-events
  'micro.bribeOffer':      'Yolcu, belgeleriyle birlikte kapalı bir zarf uzatıyor.',
  'micro.diplomatic':      'Yolcu diplomatik dokunulmazlık iddiasında bulunuyor ve hızlı işlem talep ediyor.',
  'micro.lostBoarding':    'Yolcunun yalnızca pasaportu var — biniş kartı kayıp veya bulunamıyor.',
  'micro.nicknameMismatch':'Biniş kartındaki isim takma ad veya kısaltılmış görünüyor.',
  'micro.visiblyIll':      'Yolcu hasta görünüyor. Öksürüyor. Yüzü kızarmış.',
  'micro.cryingChild':     'Yolcunun küçük bir çocuğu var. Çocuk üzgün. Yolcu girişi yalvarıyor.',

  // ANIMUS
  'animus.tab':            '◈ ANİMUS',
  'animus.symbol':         '◈',

  // Queue badges
  'queue.ok':              'OK',
  'queue.err':             'HATA',
};

// ─────────────────────────────────────────────────────────────
// ENGINE
// ─────────────────────────────────────────────────────────────
const LANGS = { en: LANG_EN, tr: LANG_TR };
let _lang = 'en';

// Load saved language
try {
  const saved = JSON.parse(localStorage.getItem('chk_settings') || '{}');
  if (saved.language && LANGS[saved.language]) _lang = saved.language;
} catch(e) {}

/**
 * Translate key with optional param substitution.
 * t('summary.report', { day: 3 })  →  "DAY 3 — SHIFT REPORT"
 */
window.t = function t(key, params) {
  let str = (LANGS[_lang] && LANGS[_lang][key]) || LANGS['en'][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }
  return str;
};

/**
 * Update all DOM elements that have a data-i18n attribute.
 * Also handles data-i18n-html for innerHTML variants.
 */
window.applyI18n = function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = window.t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = window.t(el.dataset.i18nHtml);
  });
  // Update page title
  document.title = window.t('init.title');
};

/**
 * Switch language, save preference, refresh all translatable UI.
 */
window.setLanguage = function setLanguage(lc) {
  if (!LANGS[lc]) return;
  _lang = lc;

  // Persist to settings
  try {
    const s = JSON.parse(localStorage.getItem('chk_settings') || '{}');
    s.language = lc;
    localStorage.setItem('chk_settings', JSON.stringify(s));
  } catch(e) {}

  window.applyI18n();

  // Refresh dynamic UI elements that were already rendered
  if (window.updateBulletinBoard) window.updateBulletinBoard();

  // Update action bar button labels — only update .btn-label span
  // so the .btn-symbol icon is preserved in the new desk-stamp design
  const labels = {
    'btn-approve': 'btn.approve', 'btn-deny': 'btn.deny',
    'btn-detain':  'btn.detain',  'btn-flag': 'btn.flag',
  };
  Object.entries(labels).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const lbl = el.querySelector('.btn-label');
    if (lbl) {
      // Strip leading symbol (✓ ✗ ▲ ⚑) and whitespace, uppercase result
      const full = window.t(key);
      lbl.textContent = full.replace(/^[✓✗▲⚑≡⚙\s]+/, '').toUpperCase();
    } else {
      el.textContent = window.t(key);
    }
  });
};

window._getLang = () => _lang;

console.log('[CHECKPOINT] Language system loaded — lang:', _lang);
