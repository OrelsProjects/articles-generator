import {
  CookieName as CookieNameDB,
  CookieSameSite as CookieSameSiteDB,
} from "@prisma/client";
import prisma from "@/app/api/_db/db";
import {
  SubstackCookie,
  CookieSameSite,
  CookieName,
} from "@/types/useSubstack.type";

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
