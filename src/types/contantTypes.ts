export type componentLinkTT = {
  color: string;
  name: string;
  tooltip: string;
  link: string;
  path: string;
};

export type problemLinkTT = {
  color: string;
  number: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  level: string;
  topics: string[];
  tooltip: string;
  link: string;
};
