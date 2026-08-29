import { useState } from 'react';
import {
  HelpCircle,
  Hotel,
  Baby,
  Users,
  BedDouble,
  UserCheck,
  MessageSquare,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  Search,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api, { getErrorMessage } from '@/lib/api';

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState('hotels-import');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/hotels/import-template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hotels_rooms_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const navItems = [
    { id: 'hotels-import', label: 'Hotel & Room Excel Import', icon: Hotel },
    { id: 'children-gifts', label: 'Children & Gift Tracking', icon: Baby },
    { id: 'registrations', label: 'Registrations & Payments', icon: Users },
    { id: 'accommodation', label: 'Accommodation Allocation', icon: BedDouble },
    { id: 'attendance', label: 'Attendance Desk & QR', icon: UserCheck },
    { id: 'sms', label: 'SMS & WhatsApp Campaigns', icon: MessageSquare },
    { id: 'faq', label: 'Frequently Asked Questions', icon: HelpCircle },
  ];

  const faqs = [
    {
      q: 'How do I add multiple rooms to a single hotel in Excel?',
      a: 'In your Excel sheet, write the exact same Hotel Name for multiple consecutive rows, and specify different Room Numbers (e.g., Row 1: Hotel Vrindavan - Room 101, Row 2: Hotel Vrindavan - Room 102). The system will automatically create 1 hotel and place all rooms inside it.',
    },
    {
      q: 'What happens if I re-upload an Excel sheet with existing hotel names?',
      a: 'The system automatically updates the existing hotel and rooms instead of creating duplicates. If a room number already exists under that hotel, its capacity and type will be updated.',
    },
    {
      q: 'Which children appear in the Children & Gift tab?',
      a: 'All devotees and family members registered in the database whose age is 16 years or younger (age ≤ 16). Main registrants as well as family members in a group registration are included.',
    },
    {
      q: 'Can a Viewer role change payment or gift status?',
      a: 'No. Users with the "Viewer" role can view all data, filter, and export reports, but cannot add, edit, or toggle payment approvals, gift statuses, or accommodation assignments.',
    },
    {
      q: 'Where do I change registration settings (opening/closing form)?',
      a: 'Go to "Registration Settings" in the sidebar menu. You can toggle the registration state, edit custom closed messages, and set standard donation amounts.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <BookOpen className="h-7 w-7 text-indigo-600" />
            Admin Help Center & User Manual
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Comprehensive step-by-step guides, bulk upload instructions, and administrative documentation.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Navigation Sidebar */}
        <Card className="md:col-span-1 shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Help Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB 1: Hotel & Room Excel Import */}
          {activeTab === 'hotels-import' && (
            <Card className="shadow-sm border-t-4 border-t-indigo-600">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                      <Hotel className="h-5 w-5 text-indigo-600" />
                      Bulk Adding Hotels & Rooms via Excel (.xlsx / .csv)
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      Follow these steps to import dozens of hotels and hundreds of rooms in one click.
                    </p>
                  </div>
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-indigo-600 border-indigo-200 bg-white hover:bg-indigo-50"
                  >
                    <Download className="h-4 w-4" /> Download Sample Excel Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-sm text-slate-700">
                {/* Step 1 */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      1
                    </span>
                    Download & Open the Excel Template
                  </h3>
                  <p className="text-slate-600 pl-8">
                    Go to the <strong>Hotels</strong> section in the Admin menu, click on <strong>Import Excel</strong>, and click <strong>Sample Template (.xlsx)</strong> to get the pre-structured Excel spreadsheet.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      2
                    </span>
                    Understand the Excel Sheet Structure
                  </h3>
                  <p className="text-slate-600 pl-8">
                    Each row in the Excel sheet represents one hotel room. If a hotel has multiple rooms, repeat the <strong>Hotel Name</strong> on each row.
                  </p>

                  <div className="pl-8 overflow-x-auto">
                    <table className="w-full text-xs text-left border rounded-lg">
                      <thead className="bg-slate-800 text-white font-semibold">
                        <tr>
                          <th className="p-2.5">Column Header</th>
                          <th className="p-2.5">Required?</th>
                          <th className="p-2.5">Example Value</th>
                          <th className="p-2.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Hotel Name</td>
                          <td className="p-2.5 text-emerald-700 font-semibold">Yes</td>
                          <td className="p-2.5 font-mono text-slate-600">Hotel Vrindavan Palace</td>
                          <td className="p-2.5 text-slate-600">Name of the hotel. Rows with matching names group together.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Hotel Address</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-mono text-slate-600">Raman Reti Road, Vrindavan</td>
                          <td className="p-2.5 text-slate-600">Physical address or location landmark.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Google Map Link</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-mono text-slate-600">https://maps.google.com/...</td>
                          <td className="p-2.5 text-slate-600">Valid web link to Google Maps location.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Room No</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-mono text-slate-600">101, 102, DORM-A</td>
                          <td className="p-2.5 text-slate-600">Room number or hall identifier.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Room Type</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-mono text-slate-600">DELUXE_AC</td>
                          <td className="p-2.5 text-slate-600">Room classification (see allowed enum values below).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Room Capacity</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-mono text-slate-600">2, 4, 10</td>
                          <td className="p-2.5 text-slate-600">Max occupants supported (default: 1).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Current Occupancy</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-mono text-slate-600">0</td>
                          <td className="p-2.5 text-slate-600">Initial occupied bed count (default: 0).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Notes</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-mono text-slate-600">Ground floor near lift</td>
                          <td className="p-2.5 text-slate-600">Special remarks or allocation instructions.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">Active</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-mono text-slate-600">Yes / No</td>
                          <td className="p-2.5 text-slate-600">Active status for accommodation matching (default: Yes).</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      3
                    </span>
                    Allowed Room Types
                  </h3>
                  <div className="pl-8 flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded bg-slate-100 border font-mono text-xs text-slate-800">
                      DELUXE_AC
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 border font-mono text-xs text-slate-800">
                      PREMIUM_AC
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 border font-mono text-xs text-slate-800">
                      AC_SHARING
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 border font-mono text-xs text-slate-800">
                      NON_AC_SHARING
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 border font-mono text-xs text-slate-800">
                      DORMITORY
                    </span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      4
                    </span>
                    Upload & Process
                  </h3>
                  <p className="text-slate-600 pl-8">
                    Click <strong>Upload & Process</strong> in the modal. The system will create all new hotels and rooms instantly, and give you an automated summary report.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Children & Gift Tracking */}
          {activeTab === 'children-gifts' && (
            <Card className="shadow-sm border-t-4 border-t-pink-500">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <Baby className="h-5 w-5 text-pink-600" />
                  Children & Gift Management (Age ≤ 16)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm text-slate-700">
                <p>
                  The <strong>Children</strong> page lists all children in the database whose registered age is <strong>16 years or younger</strong> (both main registrants and family members).
                </p>

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <div className="rounded-lg bg-pink-50 p-4 border border-pink-200">
                    <h4 className="font-bold text-pink-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-pink-600" />
                      Gift Given Toggle
                    </h4>
                    <p className="mt-1 text-xs text-pink-800">
                      Click the <strong>YES (Gift Given)</strong> or <strong>NO (Pending)</strong> badge on any row to instantly update gift distribution state in real time.
                    </p>
                  </div>

                  <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-200">
                    <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                      Export & Age Filters
                    </h4>
                    <p className="mt-1 text-xs text-indigo-800">
                      Filter children by age brackets (0–5 yrs, 6–12 yrs, 13–16 yrs) or gift status, and download a complete Excel report for field volunteers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Registrations & Payments */}
          {activeTab === 'registrations' && (
            <Card className="shadow-sm border-t-4 border-t-emerald-500">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Registrations & Payment Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm text-slate-700">
                <p>
                  Manage all devotee registrations, view uploaded payment screenshots, approve Laxmi contributions, and update attendee categories.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li><strong>Approve Payment:</strong> Click to confirm payment reference IDs and screenshots. This moves the status to <em>APPROVED</em>.</li>
                  <li><strong>Non-Attending Devotees:</strong> Devotees who registered as <em>NON_ATTENDING</em> or <em>ATTENDING_NOT_STAYING</em> do not require hotel room assignments.</li>
                  <li><strong>Excel Export:</strong> Export all filtered registrations to Excel with 1 click.</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Accommodation Allocation */}
          {activeTab === 'accommodation' && (
            <Card className="shadow-sm border-t-4 border-t-purple-500">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <BedDouble className="h-5 w-5 text-purple-600" />
                  Accommodation Assignment & Room Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm text-slate-700">
                <p>
                  Assign devotees and family groups to specific hotels and room numbers.
                </p>
                <div className="rounded-lg bg-slate-50 p-4 border space-y-2 text-xs">
                  <p className="font-semibold text-slate-900">Key Features:</p>
                  <p>• Select room numbers created from the <strong>Hotels</strong> section.</p>
                  <p>• Room capacity and current occupancy update automatically when rooms are allocated.</p>
                  <p>• Filter pending assignments vs allocated assignments.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: Attendance Desk */}
          {activeTab === 'attendance' && (
            <Card className="shadow-sm border-t-4 border-t-blue-500">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Attendance Desk & Check-In Desk
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm text-slate-700">
                <p>
                  Use the <strong>Attendance Desk</strong> at the reception counter during event arrival.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li><strong>QR Code Scanning:</strong> Scan the devotee's QR token directly with a webcam or barcode scanner.</li>
                  <li><strong>Individual / Group Check-In:</strong> Mark check-in for individual family members or the whole group simultaneously.</li>
                  <li><strong>Hotel Key Tracking:</strong> Record key distribution (Key Given / Key Returned) directly from the desk.</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* TAB 6: SMS & WhatsApp Campaigns */}
          {activeTab === 'sms' && (
            <Card className="shadow-sm border-t-4 border-t-orange-500">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                  SMS & WhatsApp Communication Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm text-slate-700">
                <p>
                  Send bulk SMS or WhatsApp template messages to devotees based on category, payment status, or arrival status.
                </p>
              </CardContent>
            </Card>
          )}

          {/* TAB 7: FAQ */}
          {activeTab === 'faq' && (
            <Card className="shadow-sm border-t-4 border-t-amber-500">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <HelpCircle className="h-5 w-5 text-amber-600" />
                  Frequently Asked Questions (FAQ)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors text-sm"
                    >
                      <span>{faq.q}</span>
                      {expandedFaq === idx ? (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                    </button>
                    {expandedFaq === idx && (
                      <div className="p-4 pt-0 text-xs text-slate-600 border-t bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
