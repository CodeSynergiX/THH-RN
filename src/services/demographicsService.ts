import { defaultApiClient } from './apiClient';
import { Category } from '../models/category.model';
import { District, NearestLocationResult } from '../models/demographics.model';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 1,
    slug: 'schemes',
    icon: 'bank',
    name_gu: 'સરકારી યોજનાઓ (Govt. Schemes)',
    name_en: 'Government Schemes',
    is_active: true,
    sub_categories: [
      {
        id: 101,
        category_id: 1,
        slug: 'awas_yojana',
        name_gu: 'આદિવાસી આવાસ સહાય (Housing)',
        name_en: 'Tribal Housing Aid',
        is_active: true,
      },
      {
        id: 102,
        category_id: 1,
        slug: 'solar_pump',
        name_gu: 'સોલાર કૃષિ પંપ યોજના (Solar Pump)',
        name_en: 'Solar Pump Scheme',
        is_active: true,
      },
      {
        id: 103,
        category_id: 1,
        slug: 'forest_rights',
        name_gu: 'વન અધિકાર પટ્ટા (Forest Rights - FRA)',
        name_en: 'Forest Rights Title',
        is_active: true,
      },
      {
        id: 104,
        category_id: 1,
        slug: 'ration_card',
        name_gu: 'અંત્યોદય રેશન કાર્ડ સહાય',
        name_en: 'Antyodaya Ration Aid',
        is_active: true,
      },
    ],
  },
  {
    id: 2,
    slug: 'scholarships',
    icon: 'school',
    name_gu: 'શિષ્યવૃત્તિ સહાય (Scholarships)',
    name_en: 'Scholarships & Higher Education',
    is_active: true,
    sub_categories: [
      {
        id: 201,
        category_id: 2,
        slug: 'post_matric',
        name_gu: 'પોસ્ટ-મેટ્રિક શિષ્યવૃત્તિ (Post-Matric)',
        name_en: 'Post-Matric Scholarship',
        is_active: true,
      },
      {
        id: 202,
        category_id: 2,
        slug: 'higher_education_grant',
        name_gu: 'ઉચ્ચ શિક્ષણ ફેલોશિપ (Higher Education)',
        name_en: 'Higher Education Grant',
        is_active: true,
      },
      {
        id: 203,
        category_id: 2,
        slug: 'vidyasadhana_bicycle',
        name_gu: 'વિદ્યાસાધના સાયકલ યોજના',
        name_en: 'Vidyasadhana Bicycle Scheme',
        is_active: true,
      },
      {
        id: 204,
        category_id: 2,
        slug: 'hostel_admission',
        name_gu: 'આદર્શ નિવાસી છાત્રાલય પ્રવેશ',
        name_en: 'Adarsh Nivasi Hostel',
        is_active: true,
      },
    ],
  },
  {
    id: 3,
    slug: 'jobs',
    icon: 'briefcase',
    name_gu: 'નોકરી અને રોજગાર (Jobs & Skills)',
    name_en: 'Jobs & Apprenticeships',
    is_active: true,
    sub_categories: [
      {
        id: 301,
        category_id: 3,
        slug: 'govt_recruitment',
        name_gu: 'સરકારી ભરતી માર્ગદર્શન (Govt. Jobs)',
        name_en: 'Govt Recruitment Guidance',
        is_active: true,
      },
      {
        id: 302,
        category_id: 3,
        slug: 'vocational_training',
        name_gu: 'કૌશલ્ય વર્ધન તાલીમ (Skill Training)',
        name_en: 'Vocational Skill Training',
        is_active: true,
      },
      {
        id: 303,
        category_id: 3,
        slug: 'private_placement',
        name_gu: 'ખાનગી કંપની રોજગાર કેમ્પ',
        name_en: 'Private Job Placement',
        is_active: true,
      },
      {
        id: 304,
        category_id: 3,
        slug: 'apprentice_placement',
        name_gu: 'અપ્રેન્ટિસ ભરતી (Apprenticeships)',
        name_en: 'Apprentice Placement',
        is_active: true,
      },
    ],
  },
  {
    id: 4,
    slug: 'health',
    icon: 'heart-pulse',
    name_gu: 'આરોગ્ય અને રક્તદાન (Health & Blood)',
    name_en: 'Healthcare & Emergency Blood',
    is_active: true,
    sub_categories: [
      {
        id: 401,
        category_id: 4,
        slug: 'sickle_cell_aid',
        name_gu: 'સિકલ સેલ એનિમિયા સહાય (Sickle Cell)',
        name_en: 'Sickle Cell Anemia Aid',
        is_active: true,
      },
      {
        id: 402,
        category_id: 4,
        slug: 'emergency_blood',
        name_gu: 'તાત્કાલિક રક્ત સહાય (Emergency Blood)',
        name_en: 'Emergency Blood Request',
        is_active: true,
      },
      {
        id: 403,
        category_id: 4,
        slug: 'free_camp',
        name_gu: 'મફત નિદાન અને શસ્ત્રક્રિયા કેમ્પ',
        name_en: 'Free Medical Checkup Camp',
        is_active: true,
      },
      {
        id: 404,
        category_id: 4,
        slug: 'maternal_health',
        name_gu: 'માતૃત્વ પોષણ સહાય (Maternal Health)',
        name_en: 'Maternal Nutrition Support',
        is_active: true,
      },
    ],
  },
  {
    id: 5,
    slug: 'sakhi',
    icon: 'account-group',
    name_gu: 'સખી મંડળ સહાય (Women Support)',
    name_en: 'Sakhi Circles & SHG Support',
    is_active: true,
    sub_categories: [
      {
        id: 501,
        category_id: 5,
        slug: 'shg_loan',
        name_gu: 'સ્વ-સહાય જૂથ લોન અને સબસિડી',
        name_en: 'SHG Low-Interest Loan',
        is_active: true,
      },
      {
        id: 502,
        category_id: 5,
        slug: 'handicraft_sales',
        name_gu: 'હસ્તકલા અને વાંસકામ વેચાણ બજાર',
        name_en: 'Handicrafts & Forest Products',
        is_active: true,
      },
      {
        id: 503,
        category_id: 5,
        slug: 'sewing_machine',
        name_gu: 'માનવ ગરિમા સિલાઈ મશીન સહાય',
        name_en: 'Sewing Machine Aid',
        is_active: true,
      },
    ],
  },
  {
    id: 6,
    slug: 'entrepreneurship',
    icon: 'storefront',
    name_gu: 'આદિવાસી વ્યવસાય (Tribal Business)',
    name_en: 'Tribal Entrepreneurship',
    is_active: true,
    sub_categories: [
      {
        id: 601,
        category_id: 6,
        slug: 'tribepreneur',
        name_gu: 'ટ્રાઇબપ્રેન્યોર સ્ટાર્ટઅપ અનુદાન',
        name_en: 'TribePreneur Seed Grant',
        is_active: true,
      },
      {
        id: 602,
        category_id: 6,
        slug: 'dairy_farming',
        name_gu: 'ડેરી ફાર્મિંગ અને પશુપાલન સહાય',
        name_en: 'Dairy Farming & Animal Aid',
        is_active: true,
      },
      {
        id: 603,
        category_id: 6,
        slug: 'drip_irrigation',
        name_gu: 'ટપક સિંચાઈ સાધન સહાય',
        name_en: 'Drip Irrigation Equipment',
        is_active: true,
      },
    ],
  },
  {
    id: 7,
    slug: 'legal',
    icon: 'scale-balance',
    name_gu: 'કાનૂની માર્ગદર્શન (Legal Guidance)',
    name_en: 'Legal Aid & Rights',
    is_active: true,
    sub_categories: [
      {
        id: 701,
        category_id: 7,
        slug: 'land_dispute',
        name_gu: 'જમીન વિવાદ અને વારસાઈ હક્ક',
        name_en: 'Land Rights & Succession',
        is_active: true,
      },
      {
        id: 702,
        category_id: 7,
        slug: 'caste_certificate',
        name_gu: 'જાતિ પ્રમાણપત્ર અને વેરિફિકેશન',
        name_en: 'Caste Certificate Scrutiny',
        is_active: true,
      },
      {
        id: 703,
        category_id: 7,
        slug: 'human_rights',
        name_gu: 'આદિવાસી હક્ક રક્ષણ સહાય',
        name_en: 'Tribal Rights Protection',
        is_active: true,
      },
    ],
  },
  {
    id: 8,
    slug: 'competitive_exams',
    icon: 'notebook-check',
    name_gu: 'સ્પર્ધાત્મક પરીક્ષા (Exam Preparation)',
    name_en: 'Competitive Exam Prep',
    is_active: true,
    sub_categories: [
      {
        id: 801,
        category_id: 8,
        slug: 'gpsc_coaching',
        name_gu: 'GPSC વર્ગ ૧-૨ મફત કોચિંગ',
        name_en: 'GPSC Free Coaching',
        is_active: true,
      },
      {
        id: 802,
        category_id: 8,
        slug: 'police_constable',
        name_gu: 'પોલીસ કોન્સ્ટેબલ શારીરિક કસોટી',
        name_en: 'Police Physical Training',
        is_active: true,
      },
      {
        id: 803,
        category_id: 8,
        slug: 'mock_tests',
        name_gu: 'ઓનલાઇન મોક ટેસ્ટ અને પુસ્તકો',
        name_en: 'Mock Tests & Study Books',
        is_active: true,
      },
    ],
  },
  {
    id: 9,
    slug: 'village_reports',
    icon: 'home-alert',
    name_gu: 'ગામ પ્રશ્નો અને ફરિયાદ (Village Problems)',
    name_en: 'Village Infrastructure Issues',
    is_active: true,
    sub_categories: [
      {
        id: 901,
        category_id: 9,
        slug: 'drinking_water',
        name_gu: 'પીવાનું શુદ્ધ પાણી અને હેન્ડપંપ',
        name_en: 'Drinking Water & Handpump',
        is_active: true,
      },
      {
        id: 902,
        category_id: 9,
        slug: 'road_connectivity',
        name_gu: 'ગામ સંપર્ક રસ્તો અને પુલિયું',
        name_en: 'Village Road Connectivity',
        is_active: true,
      },
      {
        id: 903,
        category_id: 9,
        slug: 'electricity_fault',
        name_gu: 'વીજળી ટ્રાન્સફોર્મર અને સ્ટ્રીટ લાઈટ',
        name_en: 'Electricity & Transformer',
        is_active: true,
      },
      {
        id: 904,
        category_id: 9,
        slug: 'school_health_center',
        name_gu: 'પ્રાથમિક શાળા અને આરોગ્ય કેન્દ્ર',
        name_en: 'Primary School / Health Subcenter',
        is_active: true,
      },
    ],
  },
  {
    id: 10,
    slug: 'volunteer',
    icon: 'hand-heart',
    name_gu: 'સ્વયંસેવક નેટવર્ક (Volunteer Network)',
    name_en: 'Grassroots Volunteer Team',
    is_active: true,
    sub_categories: [
      {
        id: 1001,
        category_id: 10,
        slug: 'grassroots_volunteer',
        name_gu: 'ગામ સ્વયંસેવક (Village Volunteer)',
        name_en: 'Village Grassroots Volunteer',
        is_active: true,
      },
      {
        id: 1002,
        category_id: 10,
        slug: 'mentor_support',
        name_gu: 'વિદ્યાર્થી માર્ગદર્શક (Mentor)',
        name_en: 'Student Mentor',
        is_active: true,
      },
      {
        id: 1003,
        category_id: 10,
        slug: 'emergency_blood_donor',
        name_gu: 'ઇમરજન્સી રક્તદાતા (Blood Donor)',
        name_en: 'Emergency Blood Donor',
        is_active: true,
      },
    ],
  },
];

export const DEFAULT_DISTRICTS: District[] = [
  {
    id: 1,
    name_en: 'Chhota Udepur',
    name_gu: 'છોટા ઉદેપુર',
    is_active: true,
    talukas: [
      {
        id: 11,
        district_id: 1,
        name_en: 'Kawant',
        name_gu: 'કવાંટ',
        is_active: true,
        villages: [
          {
            id: 111,
            taluka_id: 11,
            name_en: 'Panvad',
            name_gu: 'પાનવડ',
            is_active: true,
          },
          {
            id: 112,
            taluka_id: 11,
            name_en: 'Mogra',
            name_gu: 'મોગરા',
            is_active: true,
          },
          {
            id: 113,
            taluka_id: 11,
            name_en: 'Raypur',
            name_gu: 'રાયપુર',
            is_active: true,
          },
        ],
      },
      {
        id: 12,
        district_id: 1,
        name_en: 'Nasvadi',
        name_gu: 'નસવાડી',
        is_active: true,
        villages: [
          {
            id: 121,
            taluka_id: 12,
            name_en: 'Haripura',
            name_gu: 'હરિપુરા',
            is_active: true,
          },
          {
            id: 122,
            taluka_id: 12,
            name_en: 'Dhamasiya',
            name_gu: 'ધમાસિયા',
            is_active: true,
          },
        ],
      },
      {
        id: 13,
        district_id: 1,
        name_en: 'Bodeli',
        name_gu: 'બોડેલી',
        is_active: true,
        villages: [
          {
            id: 131,
            taluka_id: 13,
            name_en: 'Alipura',
            name_gu: 'અલીપુરા',
            is_active: true,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name_en: 'Narmada',
    name_gu: 'નર્મદા',
    is_active: true,
    talukas: [
      {
        id: 21,
        district_id: 2,
        name_en: 'Dediapada',
        name_gu: 'ડેડિયાપાડા',
        is_active: true,
        villages: [
          {
            id: 211,
            taluka_id: 21,
            name_en: 'Mosut',
            name_gu: 'મોસૂત',
            is_active: true,
          },
          {
            id: 212,
            taluka_id: 21,
            name_en: 'Samot',
            name_gu: 'સામોટ',
            is_active: true,
          },
        ],
      },
      {
        id: 22,
        district_id: 2,
        name_en: 'Sagbara',
        name_gu: 'સાગબારા',
        is_active: true,
        villages: [
          {
            id: 221,
            taluka_id: 22,
            name_en: 'Pat',
            name_gu: 'પાટ',
            is_active: true,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name_en: 'Dahod',
    name_gu: 'દાહોદ',
    is_active: true,
    talukas: [
      {
        id: 31,
        district_id: 3,
        name_en: 'Garbada',
        name_gu: 'ગરબાડા',
        is_active: true,
        villages: [
          {
            id: 311,
            taluka_id: 31,
            name_en: 'Gangardi',
            name_gu: 'ગાંગરડી',
            is_active: true,
          },
        ],
      },
      {
        id: 32,
        district_id: 3,
        name_en: 'Jhalod',
        name_gu: 'ઝાલોદ',
        is_active: true,
        villages: [
          {
            id: 321,
            taluka_id: 32,
            name_en: 'Limdi',
            name_gu: 'લીમડી',
            is_active: true,
          },
        ],
      },
    ],
  },
  {
    id: 4,
    name_en: 'Tapi',
    name_gu: 'તાપી',
    is_active: true,
    talukas: [
      {
        id: 41,
        district_id: 4,
        name_en: 'Vyara',
        name_gu: 'વ્યારા',
        is_active: true,
        villages: [
          {
            id: 411,
            taluka_id: 41,
            name_en: 'Kelkutch',
            name_gu: 'કેલકુચ્છ',
            is_active: true,
          },
        ],
      },
    ],
  },
];

export class DemographicsService {
  async getCategories(): Promise<Category[]> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: Category[];
      }>('/categories');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  async getDistricts(): Promise<District[]> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: District[];
      }>('/districts');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return DEFAULT_DISTRICTS;
    } catch {
      return DEFAULT_DISTRICTS;
    }
  }

  async getNearestLocation(lat: number, lng: number): Promise<NearestLocationResult | null> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: NearestLocationResult;
      }>(`/locations/nearest?lat=${lat}&lng=${lng}`);
      if (res?.success && res.data) {
        return res.data;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const demographicsService = new DemographicsService();
