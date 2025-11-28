export type GetAllOpts = {
  filter?: string;    
  orderby?: string;   
  top?: number;        
};

export type PageResult<T> = {
  items: T[];
  nextLink: string | null;
};

export type DateRange = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
};

export type SortDir = 'asc' | 'desc';
export type SortField = string;

export type rsOption = {
  label: string,
  value: string
}