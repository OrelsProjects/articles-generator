import { LANGUAGES } from "@/components/settings/consts";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface LanguageDropdownProps {
  selectedLanguage: string;
  handleLanguageChange: (value: string) => void;
  savingLanguage: boolean;
  label?: string;
}

export default function LanguageDropdown({
  selectedLanguage,
  handleLanguageChange,
  savingLanguage,
  label = "Preferred Language",
}: LanguageDropdownProps) {
  console.log("Selected language:", selectedLanguage);
  return (
    <div className="space-y-2">
      <Label htmlFor="language">{label}</Label>
      <Select
        value={selectedLanguage}
        onValueChange={handleLanguageChange}
        disabled={savingLanguage}
      >
        <SelectTrigger id="language" className="w-full">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(language => (
            <SelectItem key={language.value} value={language.value}>
              {language.label}{" "}
              <span className="text-muted-foreground">
                {language.sublabel ? `(${language.sublabel})` : ""}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {savingLanguage && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving language preference...
        </p>
      )}
      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          Note: The language preference affects the AI-generated content only,
          not the application interface.
        </p>
      </div>
    </div>
  );
}
