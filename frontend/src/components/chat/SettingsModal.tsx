import { X, User, Palette, Globe, MessageSquare, Brain, Shield, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/confirm-dialog";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsTab = "general" | "chat" | "model" | "privacy" | "account";

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [isAnimating, setIsAnimating] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { getToken } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [isUpdatingFontSize, setIsUpdatingFontSize] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [localCreativityLevel, setLocalCreativityLevel] = useState(settings.creativity_level);

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      setLocalCreativityLevel(settings.creativity_level);
    } else {
      setIsAnimating(false);
    }
  }, [open, settings.creativity_level]);
  
  // Save creativity level when modal closes
  useEffect(() => {
    if (!open && localCreativityLevel !== settings.creativity_level) {
      updateSettings({ creativity_level: localCreativityLevel });
    }
  }, [open]);

  const handleDeleteAllChats = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("فشل في المصادقة");
        setIsDeleting(false);
        return;
      }

      const response = await fetch(`${API_BASE}/chats`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        toast.success("تم حذف جميع المحادثات بنجاح");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("فشل في حذف المحادثات");
      }
    } catch (error) {
      console.error('Failed to delete chats:', error);
      toast.error("فشل في حذف المحادثات");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleExportData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("فشل في المصادقة");
        return;
      }

      const response = await fetch(`${API_BASE}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const chats = await response.json();
        const dataStr = JSON.stringify(chats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hadra-chats-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("تم تصدير البيانات بنجاح");
      } else {
        toast.error("فشل في تصدير البيانات");
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error("فشل في تصدير البيانات");
    }
  };

  const tabs = [
    { id: "general" as SettingsTab, label: "عام", icon: Palette },
    { id: "chat" as SettingsTab, label: "المحادثات", icon: MessageSquare },
    { id: "model" as SettingsTab, label: "النموذج", icon: Brain },
    { id: "privacy" as SettingsTab, label: "الخصوصية", icon: Shield },
    { id: "account" as SettingsTab, label: "الحساب", icon: User },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="fixed inset-0 md:relative md:w-[95vw] md:max-w-4xl h-screen md:h-[80vh] p-0 gap-0 backdrop-blur-xl bg-background/95 overflow-hidden"
        style={{
          animation: isAnimating 
            ? 'smoothFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' 
            : 'smoothFadeOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards',
          willChange: 'opacity, backdrop-filter, transform',
        }}
      >
        <div 
          className="flex h-full overflow-hidden"
          style={{
            animation: isAnimating 
              ? 'contentSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s backwards' 
              : 'none',
          }}
        >
          {/* Sidebar (visible on md+) */}
          <div className="hidden md:flex w-64 border-l border-border bg-muted/30 p-6 flex-shrink-0">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-semibold text-right">الإعدادات</DialogTitle>
            </DialogHeader>
            
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-foreground text-background"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile tabs (top horizontal) */}
          <div className="md:hidden absolute top-0 left-0 right-14 z-10 bg-background/95 border-b border-border">
            <div className="flex gap-2 px-4 py-3 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap touch-manipulation ${
                      activeTab === tab.id ? 'bg-foreground text-background' : 'text-foreground/80 hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-14 md:pt-8">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-right">الإعدادات العامة</h2>
                  <p className="text-sm text-muted-foreground text-right mb-6">
                    خصص تجربتك مع Hadra
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Theme */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-medium mb-2 text-right">المظهر</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      اختر المظهر المناسب لك
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => updateSettings({ theme: 'dark' })}
                        className={`px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors ${
                          settings.theme === 'dark' ? 'bg-foreground text-background' : ''
                        }`}
                      >
                        داكن
                      </button>
                      <button 
                        onClick={() => updateSettings({ theme: 'light' })}
                        className={`px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors ${
                          settings.theme === 'light' ? 'bg-foreground text-background' : ''
                        }`}
                      >
                        فاتح
                      </button>
                      <button 
                        onClick={() => updateSettings({ theme: 'auto' })}
                        className={`px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors ${
                          settings.theme === 'auto' ? 'bg-foreground text-background' : ''
                        }`}
                      >
                        تلقائي
                      </button>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-medium mb-2 text-right">اللغة</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      اختر لغة التطبيق
                    </p>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-right"
                      value={settings.language}
                      onChange={(e) => updateSettings({ language: e.target.value as 'ar' | 'en' | 'fr' })}
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-medium mb-2 text-right">حجم الخط</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      حدد حجم الخط المناسب
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => updateSettings({ font_size: 'large' })}
                        className={`px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors ${
                          settings.font_size === 'large' ? 'bg-foreground text-background' : ''
                        }`}
                      >
                        كبير
                      </button>
                      <button 
                        onClick={() => updateSettings({ font_size: 'medium' })}
                        className={`px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors ${
                          settings.font_size === 'medium' ? 'bg-foreground text-background' : ''
                        }`}
                      >
                        متوسط
                      </button>
                      <button 
                        onClick={() => updateSettings({ font_size: 'small' })}
                        className={`px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors ${
                          settings.font_size === 'small' ? 'bg-foreground text-background' : ''
                        }`}
                      >
                        صغير
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-right">إعدادات المحادثات</h2>
                  <p className="text-sm text-muted-foreground text-right mb-6">
                    إدارة محادثاتك وسجلها
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Auto-save */}
                  <div className="border-b border-border pb-6 flex items-center justify-between">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.auto_save_chats}
                        onChange={(e) => updateSettings({ auto_save_chats: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                    </label>
                    <div className="text-right">
                      <h3 className="text-lg font-medium mb-1">حفظ المحادثات تلقائياً</h3>
                      <p className="text-sm text-muted-foreground">
                        احفظ جميع المحادثات تلقائياً
                      </p>
                    </div>
                  </div>

                  {/* Chat History */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-medium mb-2 text-right">سجل المحادثات</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      احذف جميع محادثاتك السابقة
                    </p>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'جاري الحذف...' : 'حذف جميع المحادثات'}
                    </Button>
                  </div>

                  {/* Export Data */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-medium mb-2 text-right">تصدير البيانات</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      احصل على نسخة من محادثاتك
                    </p>
                    <Button variant="outline" className="w-full" onClick={handleExportData}>
                      تصدير المحادثات
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "model" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-right">إعدادات النموذج</h2>
                  <p className="text-sm text-muted-foreground text-right mb-6">
                    خصص إعدادات نموذج الذكاء الاصطناعي
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Model Selection */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-medium mb-2 text-right">النموذج الافتراضي</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      النموذج الحالي
                    </p>
                    <div className="w-full px-4 py-3 rounded-lg border border-border bg-muted/50 text-right font-medium">
                      Hadra-1
                    </div>
                  </div>

                  {/* Creativity */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-medium mb-2 text-right">مستوى الإبداع</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      اضبط مدى إبداع الإجابات (دقيق = 0، إبداعي = 100)
                    </p>
                    <div className="space-y-2">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={localCreativityLevel}
                        onChange={(e) => setLocalCreativityLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>إبداعي ({100})</span>
                        <span className="text-base font-semibold text-foreground">{localCreativityLevel}</span>
                        <span>دقيق ({0})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-right">الخصوصية والبيانات</h2>
                  <p className="text-sm text-muted-foreground text-right mb-6">
                    تحكم في خصوصيتك وبياناتك
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Clear All Chats */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-medium mb-2 text-right">حذف جميع المحادثات</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      احذف جميع محادثاتك بشكل دائم
                    </p>
                    <Button variant="destructive" className="w-full" onClick={() => setDeleteDialogOpen(true)}>
                      حذف جميع المحادثات
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-right">إعدادات الحساب</h2>
                  <p className="text-sm text-muted-foreground text-right mb-6">
                    إدارة حسابك
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      يتم إدارة معلومات الحساب من خلال Google OAuth
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes smoothFadeIn {
            0% {
              opacity: 0;
              backdrop-filter: blur(0px);
              transform: scale(0.96) translateY(8px);
            }
            100% {
              opacity: 1;
              backdrop-filter: blur(24px);
              transform: scale(1) translateY(0);
            }
          }

          @keyframes smoothFadeOut {
            0% {
              opacity: 1;
              backdrop-filter: blur(24px);
              transform: scale(1);
            }
            100% {
              opacity: 0;
              backdrop-filter: blur(0px);
              transform: scale(0.96);
            }
          }

          @keyframes contentSlideIn {
            0% {
              opacity: 0;
              transform: translateY(12px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </DialogContent>
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteAllChats}
        title="حذف جميع المحادثات"
        description="هل أنت متأكد من حذف جميع المحادثات؟ هذا الإجراء لا يمكن التراجع عنه."
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </Dialog>
  );
};

export default SettingsModal;
