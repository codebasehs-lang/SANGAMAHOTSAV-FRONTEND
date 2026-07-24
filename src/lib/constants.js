/**
 * Frontend option lists — must stay in sync with backend enums.
 * `value` matches the backend enum key; `label` is the display text.
 */

export const DEVOTEE_CATEGORY = [
  { value: 'DISCIPLE', label: 'Disciple' },
  { value: 'NON_DISCIPLE', label: 'Non Disciple' },
];

export const NON_ATTENDING_TYPE = [
  { value: 'NON_ATTENDING_DISCIPLE', label: 'Non attending disciple - ₹ 2000/-' },
  { value: 'ATTENDING_NOT_STAYING', label: 'Attending but not staying - ₹ 3500/-' },
];

export const SHARED_ACCOMMODATION = [
  { value: 'DORMITORY', label: 'Dormitory - ₹ 5000/-' },
  { value: 'NON_AC_SHARING', label: 'Non AC Sharing - ₹ 5500/-' },
  { value: 'AC_SHARING', label: 'AC Sharing - ₹ 7000/-' },
];

export const FAMILY_ACCOMMODATION = [
  { value: 'DELUXE_AC', label: 'AC Room - Deluxe AC - ₹ 18000/-' },
  { value: 'PREMIUM_AC', label: 'AC Room - Premium AC - ₹ 19500/-' },
];

export const ADDITIONAL_FAMILY_ACCOMMODATION = [
  { value: 'DELUXE', label: 'AC Room - Deluxe - ₹ 17500/-' },
  { value: 'PREMIUM', label: 'AC Room - Premium - ₹ 17500/-' },
];

export const PREFERRED_SUBJECT = [
  { value: 'BHAGAVAD_GITA', label: 'Bhagavad Gita' },
  { value: 'SRIMAD_BHAGAVATAM', label: 'Srimad Bhagavatam' },
  { value: 'CHAITANYA_CHARITAMRITA', label: 'Chaitanya Charitamrita' },
  { value: 'HARINAMA_CHINTAMANI', label: 'Harinama Chintamani' },
  { value: 'HOW_TO_STUDY_SB', label: 'How To Study Srimad Bhagavatam' },
  { value: 'HOW_TO_STUDY_CC', label: 'How To Study Chaitanya Charitamrita' },
  { value: 'NECTAR_OF_INSTRUCTION', label: 'Nectar Of Instruction' },
  { value: 'VAISHNAVA_ETIQUETTE', label: 'Vaishnava Etiquette' },
  { value: 'QA_SESSION', label: 'Question And Answer Session' },
  { value: 'VAISHNAVA_SONGS', label: 'Vaishnava Songs' },
  { value: 'APARADHA', label: 'Aparadha' },
  { value: 'DEALING_WITH_VAISHNAVAS', label: 'Dealing With Vaishnavas' },
  { value: 'OTHER', label: 'Other' },
];

export const SERVICES = [
  { value: 'SERVICE_COORDINATE_VOLUNTEERS', label: 'Service Coordinate Volunteers' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'KITCHEN_DEPARTMENT', label: 'Kitchen Department' },
  { value: 'VEGETABLE_GROCERY_PURCHASE', label: 'Vegetable & Grocery Purchase' },
  { value: 'STORAGE_INCHARGE', label: 'Storage Incharge' },
  { value: 'PRASADAM_SERVING', label: 'Prasadam Serving' },
  { value: 'TEMPLE_HALL_CLEANING', label: 'Temple Hall Cleaning' },
  { value: 'KITCHEN_CLEANING', label: 'Kitchen Cleaning' },
  { value: 'PRASADAM_HALL_CLEANING', label: 'Prasadam Hall Cleaning' },
  { value: 'WATER_ARRANGEMENT', label: 'Water Arrangement' },
  { value: 'DEITY_DEPARTMENT', label: 'Deity Department' },
  { value: 'DEVOTEE_STAYING_ARRANGEMENT', label: 'Devotee Staying Arrangement' },
  { value: 'DEVOTEE_CARE_HELP_DESK', label: 'Devotee Care & Help Desk' },
  { value: 'KIRTAN', label: 'Kirtan' },
  { value: 'KATHA_ARRANGEMENT', label: 'Katha Arrangement' },
  { value: 'RECORDING', label: 'Recording' },
  { value: 'BOOK_STALL', label: 'Book Stall' },
  { value: 'CHILDREN_CARE', label: 'Children Care' },
  { value: 'EMERGENCY_MEDICINE', label: 'Emergency Medicine' },
  { value: 'FLOWER_GARLAND', label: 'Flower Garland' },
  { value: 'ACCOUNTING', label: 'Accounting' },
  { value: 'GROUP_CHANTING', label: 'Group Chanting' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'TIME_KEEPING', label: 'Time Keeping' },
  { value: 'MIC_MANAGEMENT', label: 'Mic Management' },
  { value: 'QUEUE_MANAGEMENT', label: 'Queue Management' },
  { value: 'SEATING_ARRANGEMENT', label: 'Seating Arrangement' },
  { value: 'CHAPPAL_ARRANGEMENT', label: 'Chappal Arrangement' },
  { value: 'CLEANING_COMMON_AREAS', label: 'Cleaning Common Areas' },
  { value: 'BATHROOM_CLEANING', label: 'Bathroom Cleaning' },
  { value: 'PERSONAL_SERVANT_SEVA', label: 'Personal Servant Seva' },
  { value: 'COVERING_PRASADAM_VESSELS', label: 'Covering Prasadam Vessels' },
  { value: 'CAR_PARKING', label: 'Car Parking' },
  { value: 'JOURNEY_PRASAD_PACKING', label: 'Journey Prasad Packing' },
  { value: 'CLOTHES_DRYING_ARRANGEMENT', label: 'Clothes Drying Arrangement' },
];

export const ACCOMMODATION_STATUS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'NOT_REQUIRED', label: 'Not Required' },
];

export const PAYMENT_STATUS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
];

export const SMS_CAMPAIGN_TYPE = [
  { value: 'ACCOMMODATION', label: 'Accommodation Assignment' },
  { value: 'CUSTOM', label: 'Custom Message' },
];

export const PAYMENT_INFO = {
  bankAccountNumber: '30300100016357',
  accountName: 'Sandeep Kumar Gupta, Veerender Kumar & Ashok Aneja',
  ifscCode: 'BARB0DAWARK',
  phonePeUpiMobileNumber: '7840050175 (Ashok Aneja)',
};

export const EVENT_INFO = {
  title:
    '9th Sanga Mahotsav | 5th Vyasa Puja & 56th Holy Appearance Day Celebration',
  gurudeva:
    'of our Parama Ārādhyatama Gurudeva His Holiness Haladhara Swami Maharaja',
  shortName: 'Vyasa Puja 2026',
  startDate: '2nd October 2026',
  startTime: '8:00 AM',
  endDate: '7th October 2026',
  endTime: '1:00 PM',
  venue: 'ARC The Boutique Hotel, Bhubaneswar, Odisha',
};
