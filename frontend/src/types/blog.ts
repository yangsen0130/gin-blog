export interface BlogPost {
  id: string; // Or number, depending on your backend
  title: string;
  content: string;
  authorId?: string; // Optional: if you link posts to users
  authorName?: string; // Optional: to display author name
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface BlogFormValues {
  title: string;
  content: string;
} 