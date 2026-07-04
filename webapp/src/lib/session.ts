// TODO: iron-session config — httpOnly cookie, encrypt session
export interface SessionData {
  userId: string;
  username: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  userId: "",
  username: "",
  isLoggedIn: false,
};
