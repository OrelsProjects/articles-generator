import {
  CookieName as CookieNameDB,
  CookieSameSite as CookieSameSiteDB,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SubstackCookie,
  CookieSameSite,
  CookieName,
} from "@/types/useExtension.type";
import { toMilis } from "@/lib/utils/date";

const cookieNameCookieNameToDB: Record<CookieName, CookieNameDB> = {
  "substack.sid": CookieNameDB.substackSid,
  "substack.lli": CookieNameDB.substackLl,
  __cf_bm: CookieNameDB.cfBm,
};

const cookieSameSiteToDB: Record<CookieSameSite, CookieSameSiteDB> = {
  no_restriction: CookieSameSiteDB.noRestriction,
  lax: CookieSameSiteDB.lax,
  strict: CookieSameSiteDB.strict,
  unspecified: CookieSameSiteDB.unspecified,
};

export const setSubstackCookies = async (
  userId: string,
  cookies: SubstackCookie[],
) => {
  for (const cookie of cookies) {
    if (cookie.value) {
      await prisma.substackCookie.upsert({
        where: {
          name_userId: { name: cookieNameCookieNameToDB[cookie.name], userId },
        },
        update: {
          value: cookie.value,
          expiresAt: cookie.expiresAt,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookieSameSiteToDB[cookie.sameSite],
        },
        create: {
          ...cookie,
          name: cookieNameCookieNameToDB[cookie.name],
          userId,
          sameSite: cookieSameSiteToDB[cookie.sameSite],
        },
      });
    }
  }
};

export const validateCookies = async (
  userId: string,
): Promise<{
  valid: boolean;
  expiresAt?: Date;
}> => {
  try {
    const cookies = await prisma.substackCookie.findMany({
      where: { userId },
    });
    //check for sid
    const sidCookie = cookies.find(
      cookie => cookie.name === CookieNameDB.substackSid,
    );
    if (!sidCookie) {
      return { valid: false };
    }
    const sidCookieValue = sidCookie.value;
    const expiresAt = sidCookie.expiresAt;
    if (!sidCookieValue || !expiresAt) {
      return { valid: false };
    }

    const now = new Date();
    const expiresAtDate = new Date(toMilis(expiresAt));
    if (expiresAtDate < now) {
      console.error(
        "expiresAtDate < now",
        expiresAtDate,
        now,
        "expiresAt: ",
        expiresAt,
      );
      return { valid: false };
    }

    return { valid: true, expiresAt: expiresAtDate };
  } catch (error) {
    return { valid: false };
  }
};
