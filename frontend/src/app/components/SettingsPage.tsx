import { ArrowLeft, Mail, Phone, FileText, Trash2, LogOut, ChevronRight } from "lucide-react";

interface SettingsPageProps {
  onBack: () => void;
  onChangeEmail: () => void;
  onChangePhone: () => void;
  onTerms: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
  isPremium: boolean;
}

export function SettingsPage({
  onBack,
  onChangeEmail,
  onChangePhone,
  onTerms,
  onDeleteAccount,
  onLogout,
}: SettingsPageProps) {
  const settingsOptions = [
    {
      icon: Mail,
      label: "Change Email",
      onClick: onChangeEmail,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      icon: Phone,
      label: "Change Phone Number",
      onClick: onChangePhone,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
  ];

  const otherOptions = [
    {
      icon: FileText,
      label: "Terms & Conditions",
      onClick: onTerms,
      color: "text-gray-500",
      bgColor: "bg-gray-100",
    },
    {
      icon: LogOut,
      label: "Logout",
      onClick: onLogout,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      icon: Trash2,
      label: "Delete Account",
      onClick: onDeleteAccount,
      color: "text-red-500",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="p-6 border-b flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl">Settings</h1>
      </div>

      <div className="p-6">
        <h2 className="text-sm text-gray-500 mb-3">ACCOUNT SETTINGS</h2>
        <div className="space-y-2">
          {settingsOptions.map((option) => (
            <button
              key={option.label}
              onClick={option.onClick}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors"
            >
              <div className={`w-10 h-10 ${option.bgColor} rounded-full flex items-center justify-center`}>
                <option.icon className={`w-5 h-5 ${option.color}`} />
              </div>
              <span className="flex-1 text-left text-gray-900">{option.label}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-sm text-gray-500 mb-3">OTHER</h2>
        <div className="space-y-2">
          {otherOptions.map((option) => (
            <button
              key={option.label}
              onClick={option.onClick}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors"
            >
              <div className={`w-10 h-10 ${option.bgColor} rounded-full flex items-center justify-center`}>
                <option.icon className={`w-5 h-5 ${option.color}`} />
              </div>
              <span className="flex-1 text-left text-gray-900">{option.label}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 text-center text-sm text-gray-400">
        LuvLy v1.0.0
      </div>
    </div>
  );
}
