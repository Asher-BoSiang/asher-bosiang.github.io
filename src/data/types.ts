export interface Project {
  slug: string; title: string; shortDescription: string; category: string;
  technologies: string[]; themeColor: string; githubUrl: string; displayOrder: number;
}
export type Phase = 'Profile' | 'Collection' | 'Extracting' | 'Opening' | 'DiscFloating' | 'PlayerEntering' | 'TrayExtending' | 'DiscLoading' | 'TrayRetracting' | 'Details' | 'Returning';
