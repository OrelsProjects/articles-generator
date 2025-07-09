export interface GhostwriterProfile {
  id: string;
  name: string;
  image: string;
  token: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GhostwriterAccess {
  id: string;
  accountUserId: string;
  accessLevel: "full" | "editor";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ghostwriter: Omit<
    GhostwriterProfile,
    "createdAt" | "updatedAt" | "token" | "userId"
  >;
}

// New interface for client accounts the user is ghostwriting for
export interface GhostwriterClient {
  id: string;
  accountUserId: string;
  accountUserName: string;
  accountUserEmail: string;
  accountUserImage: string;
  accessLevel: "full" | "editor";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGhostwriterProfileData {
  name: string;
  image: string;
}

export interface AddGhostwriterAccessData {
  ghostwriterToken: string;
  accessLevel?: "full" | "editor";
}

export interface UpdateGhostwriterAccessData {
  ghostwriterUserId: string;
  accessLevel: "full" | "editor";
  isActive: boolean;
}

// New interface for stopping ghostwriting
export interface StopGhostwritingData {
  accessId: string;
}
