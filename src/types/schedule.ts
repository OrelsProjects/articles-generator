import { UserSchedule as UserSchedulePrisma } from "@prisma/client";

export type UserSchedule = Omit<
  UserSchedulePrisma,
  "userId" | "createdAt" | "updatedAt"
>;

export type CreateUserSchedule = Omit<UserSchedule, "id">;

export type Days = {
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
};

export const daysStringArrayToDaysObject = (days: string[]) => {
  return days.reduce(
    (acc: Days, day) => {
      acc[day as keyof Days] = true;
      return acc;
    },
    {
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
    },
  );
};
