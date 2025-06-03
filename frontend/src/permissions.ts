export const permissions = {
  owner: {
    manageSubscription: true,
    topUp: true,
    withdraw: true,
    invite: true,
    remove: true,
    manageOrg: true,
    // ...other permissions
  },
  admin: {
    manageSubscription: true,
    topUp: true,
    withdraw: true,
    invite: true,
    remove: true,
    manageOrg: true,
    // ...other permissions
  },
  member: {
    manageSubscription: false,
    topUp: true,
    withdraw: false,
    invite: false,
    remove: false,
    manageOrg: false,
    // ...other permissions
  },
};

export type Role = keyof typeof permissions; 