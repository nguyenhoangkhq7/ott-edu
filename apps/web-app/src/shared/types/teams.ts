export interface TeamItem {
  id: string;
  name: string;
  subtitle?: string;
  initials: string;
  accentColor: string;
  meta?: string;
}

export interface TeamSection {
  id: string;
  title: string;
  items: TeamItem[];
}
