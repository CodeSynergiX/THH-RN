export interface TranslationsDictionary {
  [key: string]: string;
}

export const guTranslations: TranslationsDictionary = {
  // Navigation & Brand
  'app.name': 'આદિવાસી સહાયતા કેન્દ્ર',
  'app.ngo': 'ગ્લોબલ ગ્રામીણ વિકાસ ટ્રસ્ટ (GGVT)',
  'nav.home': 'મુખ્ય પૃષ્ઠ',
  'nav.wizard': 'નવી અરજી',
  'nav.track': 'અરજી ટ્રેક',
  'nav.settings': 'સેટિંગ્સ',
  'nav.offline': 'ઓફલાઇન યાદી',

  // Actions
  'action.submit': 'અરજી સબમિટ કરો',
  'action.save': 'સાચવો',
  'action.cancel': 'રદ કરો',
  'action.next': 'આગળ વધો',
  'action.prev': 'પાછળ જાઓ',
  'action.retry': 'ફરી પ્રયાસ કરો',
  'action.track': 'તપાસ કરો',
  'action.sync_now': 'હમણાં સિન્ક કરો',
  'action.switch_lang': 'ભાષા બદલો (English)',
  'action.switch_theme': 'ડાર્ક મોડ',
  'action.upload_doc': 'દસ્તાવેજ અપલોડ કરો',

  // Dashboard Stats
  'dashboard.title': 'આદિવાસી સેવા સહાય પોર્ટલ',
  'dashboard.stats.total': 'કુલ અરજીઓ',
  'dashboard.stats.verification': 'ચકાસણી હેઠળ',
  'dashboard.stats.assistance': 'સહાય પ્રક્રિયામાં',
  'dashboard.stats.resolved': 'સફળ ઉકેલાયેલ',
  'dashboard.stats.rating': 'સરેરાશ રેટિંગ',
  'dashboard.recent_cases': 'તાજેતરની અરજીઓ',
  'dashboard.empty_cases':
    'હજુ સુધી કોઈ અરજી મળેલ નથી. નવી અરજી કરવા નીચેનું બટન દબાવો.',
  'dashboard.quick_request': 'નવી સહાયતા માંગો',

  // Case Lifecycle Statuses
  'status.received': 'પ્રાપ્ત થયેલ',
  'status.verification': 'ચકાસણી હેઠળ',
  'status.categorised': 'વર્ગીકૃત થયેલ',
  'status.assigned': 'અધિકારી નિયુક્ત',
  'status.assistance': 'સહાયતા પ્રગતિમાં',
  'status.follow_up': 'ફોલો-અપ / સમીક્ષા',
  'status.resolved': 'સફળતાપૂર્વક ઉકેલાયેલ',
  'status.rejected': 'નામંજૂર થયેલ',
  'status.on_hold': 'સ્થગિત / રોકેલ',
  'status.reopened': 'પુનઃ શરૂ કરેલ',

  // Urgency
  'urgency.normal': 'સામાન્ય',
  'urgency.urgent': 'તાત્કાલિક',
  'urgency.critical': 'અતિ ગંભીર / કટોકટી',

  // 5-Step Help Request Wizard
  'wizard.title': 'મદદ માટે અરજી કરો',
  'wizard.step1_title': '૧. સહાયતા કેટેગરી પસંદ કરો',
  'wizard.step1_desc': 'તમને કઈ બાબતમાં સહાય જોઈએ છે?',
  'wizard.step2_title': '૨. સમસ્યા કે જરૂરિયાતની વિગતો',
  'wizard.step2_desc': 'સમસ્યાનું ટૂંકું વર્ણન અને તાકીદ જણાવો.',
  'wizard.step3_title': '૩. તમારું સ્થળ (ગામ / તાલુકો)',
  'wizard.step3_desc': 'તમારો જિલ્લો, તાલુકો અને ગામ પસંદ કરો.',
  'wizard.step4_title': '૪. દસ્તાવેજો અથવા ફોટો',
  'wizard.step4_desc': 'આધાર કાર્ડ, રેશન કાર્ડ અથવા સંબંધિત અરજીનો ફોટો.',
  'wizard.step5_title': '૫. અરજીની સમીક્ષા અને ખાતરી',
  'wizard.step5_desc': 'બધી વિગતો ચકાસીને સબમિટ કરો.',
  'wizard.title_placeholder': 'અરજીનો વિષય (દા.ત. શિષ્યવૃત્તિ માટે સહાય)',
  'wizard.desc_placeholder':
    'તમારી વિગતવાર પરિસ્થિતિ અથવા જરૂરિયાત અહીં લખો...',
  'wizard.helper_mode': 'સહાયક મોડ (બીજા નાગરિક વતી અરજી)',
  'wizard.beneficiary_name': 'લાભાર્થીનું પૂરું નામ',
  'wizard.beneficiary_phone': 'લાભાર્થીનો મોબાઈલ નંબર',
  'wizard.success_title': 'અરજી સફળતાપૂર્વક નોંધાઈ ગઈ છે!',
  'wizard.case_no_label': 'તમારો અરજી ક્રમાંક:',
  'wizard.success_note':
    'આ અરજી ક્રમાંક સાચવી રાખો. તમે કોઈપણ સમયે આનાથી સ્થિતિ જાણી શકશો.',
  'wizard.offline_saved':
    'તમારો ફોન ઓફલાઇન છે. અરજી ફોનમાં સુરક્ષિત સાચવવામાં આવી છે અને ઇન્ટરનેટ આવતા આપોઆપ મોકલાઈ જશે.',

  // Tracker
  'tracker.title': 'અરજી ટ્રેકિંગ',
  'tracker.placeholder': 'અરજી નંબર દાખલ કરો (દા.ત. THH-2026-00001)',
  'tracker.search_btn': 'સ્થિતિ શોધો',
  'tracker.not_found':
    'આ અરજી ક્રમાંક માટે કોઈ માહિતી મળી નથી. કૃપા કરીને સાચો નંબર લખો.',
  'tracker.timeline_title': 'કાર્યવાહી સમયરેખા (Timeline)',

  // Offline Sync
  'offline.banner': 'ઓફલાઇન મોડ: {count} અરજીઓ સિન્ક થવાની બાકી છે',
  'offline.syncing': 'સર્વર સાથે સિન્ક થઈ રહ્યું છે...',
  'offline.synced': 'બધી બાકી અરજીઓ સર્વર પર સિન્ક થઈ ગઈ!',

  // Settings
  'settings.title': 'સેટિંગ્સ અને પ્રોફાઇલ',
  'settings.language': 'એપ્લિકેશન ભાષા',
  'settings.appearance': 'દેખાવ અને થીમ',
  'settings.dark_mode': 'ડાર્ક મોડ',
  'settings.light_mode': 'લાઇટ મોડ',
  'settings.offline_queue': 'ઓફલાઇન અરજીઓનો સંગ્રહ',
  'settings.about': 'GGVT વિશે',
  'settings.about_desc':
    'ગ્લોબલ ગ્રામીણ વિકાસ ટ્રસ્ટ (GGVT) દ્વારા આદિવાસી બંધુઓના સર્વાંગી કલ્યાણ અને સરકારી યોજનાઓના હક માટે સમર્પિત પહેલ.',
};

export const enTranslations: TranslationsDictionary = {
  // Navigation & Brand
  'app.name': 'Tribal Helping Hand',
  'app.ngo': 'Global Gramin Vikas Trust (GGVT)',
  'nav.home': 'Home',
  'nav.wizard': 'New Request',
  'nav.track': 'Track Case',
  'nav.settings': 'Settings',
  'nav.offline': 'Offline Queue',

  // Actions
  'action.submit': 'Submit Request',
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.next': 'Next',
  'action.prev': 'Back',
  'action.retry': 'Retry',
  'action.track': 'Track',
  'action.sync_now': 'Sync Now',
  'action.switch_lang': 'Switch Language (ગુજરાતી)',
  'action.switch_theme': 'Dark Mode',
  'action.upload_doc': 'Upload Document',

  // Dashboard Stats
  'dashboard.title': 'Tribal Welfare Portal',
  'dashboard.stats.total': 'Total Cases',
  'dashboard.stats.verification': 'In Verification',
  'dashboard.stats.assistance': 'In Assistance',
  'dashboard.stats.resolved': 'Resolved',
  'dashboard.stats.rating': 'Avg Rating',
  'dashboard.recent_cases': 'Recent Applications',
  'dashboard.empty_cases':
    'No cases recorded yet. Tap below to submit your first help request.',
  'dashboard.quick_request': 'Request Assistance',

  // Case Lifecycle Statuses
  'status.received': 'Received',
  'status.verification': 'In Verification',
  'status.categorised': 'Categorised',
  'status.assigned': 'Assigned',
  'status.assistance': 'In Assistance',
  'status.follow_up': 'Follow-Up',
  'status.resolved': 'Resolved',
  'status.rejected': 'Rejected',
  'status.on_hold': 'On Hold',
  'status.reopened': 'Reopened',

  // Urgency
  'urgency.normal': 'Normal',
  'urgency.urgent': 'Urgent',
  'urgency.critical': 'Critical',

  // 5-Step Help Request Wizard
  'wizard.title': 'Submit Help Request',
  'wizard.step1_title': '1. Choose Category',
  'wizard.step1_desc': 'What area do you need assistance with?',
  'wizard.step2_title': '2. Request Details',
  'wizard.step2_desc': 'Provide a clear summary and indicate urgency.',
  'wizard.step3_title': '3. Location',
  'wizard.step3_desc': 'Select your District, Taluka and Village.',
  'wizard.step4_title': '4. Supporting Documents',
  'wizard.step4_desc': 'Attach relevant IDs, scheme papers or photos.',
  'wizard.step5_title': '5. Review & Confirm',
  'wizard.step5_desc': 'Verify all details before submitting.',
  'wizard.title_placeholder': 'Title (e.g. Scholarship Application Assistance)',
  'wizard.desc_placeholder':
    'Explain your situation and requirement in detail...',
  'wizard.helper_mode': 'Helper Mode (Submitting on behalf of another citizen)',
  'wizard.beneficiary_name': 'Beneficiary Full Name',
  'wizard.beneficiary_phone': 'Beneficiary Phone Number',
  'wizard.success_title': 'Application Registered Successfully!',
  'wizard.case_no_label': 'Your Tracking Case ID:',
  'wizard.success_note':
    'Keep this case ID safe. You can track resolution status anytime.',
  'wizard.offline_saved':
    'Your device is offline. Application saved locally and will auto-sync once connected.',

  // Tracker
  'tracker.title': 'Case Tracker',
  'tracker.placeholder': 'Enter Case ID (e.g. THH-2026-00001)',
  'tracker.search_btn': 'Lookup Status',
  'tracker.not_found':
    'No application found with this Case ID. Please check the number.',
  'tracker.timeline_title': 'Audit & Progress Timeline',

  // Offline Sync
  'offline.banner': 'Offline Mode: {count} pending requests waiting to sync',
  'offline.syncing': 'Syncing with server...',
  'offline.synced': 'All queued requests synchronized successfully!',

  // Settings
  'settings.title': 'Settings & Preferences',
  'settings.language': 'Application Language',
  'settings.appearance': 'Appearance & Theme',
  'settings.dark_mode': 'Dark Mode',
  'settings.light_mode': 'Light Mode',
  'settings.offline_queue': 'Offline Sync Queue',
  'settings.about': 'About GGVT',
  'settings.about_desc':
    'Global Gramin Vikas Trust is dedicated to the empowerment and welfare of tribal communities through transparent, accountable grassroots support.',
};
