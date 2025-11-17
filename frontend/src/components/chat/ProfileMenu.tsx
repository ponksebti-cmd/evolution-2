import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, HelpCircle, Moon } from "lucide-react";
import SettingsModal from "./SettingsModal";

interface ProfileMenuProps {
  isMobile?: boolean;
}

const ProfileMenu = ({ isMobile = false }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userEmail = user?.email || "user@example.com";
  const photoURL = user?.photoURL;
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const getFirstName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    }
    return userEmail.split('@')[0];
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign-out failed", e);
    }
    navigate("/auth");
  };

  return (
    // Hide on small screens to avoid covering the menu button;
    // show bottom-right on md+ screens. On mobile, render inside sidebar.
    isMobile ? (
      <div className="w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full h-10 px-3 py-1.5 rounded-lg bg-muted border border-border flex items-center gap-2.5 hover:bg-muted/80 transition-all">
              <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium shrink-0 overflow-hidden">
                {photoURL ? (
                  <img 
                    src={photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{userEmail.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-sm font-medium text-right flex-1">{getFirstName()}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 animate-in slide-in-from-bottom-2 fade-in-0"
            style={{ 
              animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground text-right" style={{ lineHeight: 1.6 }}>{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm py-2 cursor-pointer gap-3" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <span>الملف الشخصي</span>
              <User className="h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-sm py-2 cursor-pointer gap-3" 
              style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}
              onClick={() => setSettingsOpen(true)}
            >
              <span>الإعدادات</span>
              <Settings className="h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm py-2 cursor-pointer gap-3" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <span>المظهر</span>
              <Moon className="h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm py-2 cursor-pointer gap-3" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <span>المساعدة</span>
              <HelpCircle className="h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-sm py-2 cursor-pointer gap-3" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <span>تسجيل الخروج</span>
              <LogOut className="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    ) : (
      <div className="hidden md:block fixed right-4 bottom-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-11 pl-4 pr-2 py-1.5 rounded-full bg-background border border-border flex items-center gap-2.5 hover:shadow-md hover:scale-105 transition-all shadow-sm">
              <span className="text-sm font-medium">{getFirstName()}</span>
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium shrink-0 overflow-hidden">
                {photoURL ? (
                  <img 
                    src={photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{userEmail.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 animate-in slide-in-from-bottom-2 fade-in-0"
            style={{ 
              animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-muted-foreground" style={{ lineHeight: 1.6 }}>{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-base py-2.5 cursor-pointer gap-3" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <span>الملف الشخصي</span>
              <User className="h-5 w-5" />
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-base py-2.5 cursor-pointer gap-3" 
              style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}
              onClick={() => setSettingsOpen(true)}
            >
              <span>الإعدادات</span>
              <Settings className="h-5 w-5" />
            </DropdownMenuItem>
            <DropdownMenuItem className="text-base py-2.5 cursor-pointer gap-3" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <span>المظهر</span>
              <Moon className="h-5 w-5" />
            </DropdownMenuItem>
            <DropdownMenuItem className="text-base py-2.5 cursor-pointer gap-3" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <span>المساعدة</span>
              <HelpCircle className="h-5 w-5" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-base py-2.5 cursor-pointer gap-3" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <span>تسجيل الخروج</span>
              <LogOut className="h-5 w-5" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <style>{`
          @keyframes slideUpFade {
            from {
              opacity: 0;
              transform: translateY(8px);
              filter: blur(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
              filter: blur(0);
            }
          }
        `}</style>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    )
  );
};

export default ProfileMenu;
