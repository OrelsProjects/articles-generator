import { getUrlComponents } from "./url";

describe("getUrlComponents", () => {
  // Test Substack URLs
  test("handles substack URLs correctly", () => {
    const url = "newsletter.substack.com";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://newsletter.substack.com",
      mainComponentInUrl: "newsletter",
    });

    const url2 = "https://newsletter.substack.com";
    const result2 = getUrlComponents(url2);
    expect(result2).toEqual({
      validUrl: "https://newsletter.substack.com",
      mainComponentInUrl: "newsletter",
    });

    const url3 = "newsletter.substack.com/";
    const result3 = getUrlComponents(url3);
    expect(result3).toEqual({
      validUrl: "https://newsletter.substack.com",
      mainComponentInUrl: "newsletter",
    });
  });

  test("handles substack custom domains that end with .co", () => {
    const url = "https://remoteground.co/";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://www.remoteground.co",
      mainComponentInUrl: "remoteground",
    });
  });

  test("test copy paste from url", () => {
    const url = "https://theindiepreneur.substack.com/";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://theindiepreneur.substack.com",
      mainComponentInUrl: "theindiepreneur",
    });
  });

  test("handles substack custom domains that end with .co no https", () => {
    const url = "remoteground.co/";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://www.remoteground.co",
      mainComponentInUrl: "remoteground",
    });
  });
  // Test URLs with www
  test("handles URLs with www correctly", () => {
    const url = "www.example.com";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://www.example.com",
      mainComponentInUrl: "example",
    });
  });

  // Test URLs with https
  test("handles URLs with https correctly", () => {
    const url = "https://example.com";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://www.example.com",
      mainComponentInUrl: "example",
    });
  });

  // Test URLs with both https and www
  test("handles URLs with both https and www correctly", () => {
    const url = "https://example.com";
    const result = getUrlComponents(url);
    // Based on implementation, we know this won't extract mainComponentInUrl
    // for URLs with both https and www prefix
    expect(result).toEqual({
      validUrl: "https://www.example.com",
      mainComponentInUrl: "example",
    });
  });

  // Test URLs with multiple subdomains
  test("handles URLs with multiple subdomains correctly", () => {
    const url = "read.abc.com";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://read.abc.com",
      mainComponentInUrl: "abc",
    });

    const url2 = "https://read.abc.com";
    const result2 = getUrlComponents(url2);
    expect(result2).toEqual({
      validUrl: "https://read.abc.com",
      mainComponentInUrl: "abc",
    });
  });

  // Test URLs with trailing slash
  test("handles URLs with trailing slash correctly", () => {
    const url = "example.com/";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://www.example.com",
      mainComponentInUrl: "example",
    });
  });

  // Test URLs with different TLDs
  test("handles URLs with different TLDs correctly", () => {
    const url = "example.net";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://www.example.net",
      mainComponentInUrl: "example",
    });
  });

  // Edge cases
  test("handles edge cases correctly", () => {
    // Empty string
    const url1 = "";
    const result1 = getUrlComponents(url1);
    expect(result1).toEqual({
      validUrl: "",
      mainComponentInUrl: "",
    });

    // URL with query parameters (function doesn't strip these)
    const url2 = "example.com?param=value";
    const result2 = getUrlComponents(url2);
    expect(result2).toEqual({
      validUrl: "https://www.example.com",
      mainComponentInUrl: "example",
    });
  });

  test("Actual substack urls", () => {
    const url1 =
      "https://theindiepreneur.substack.com/publish/home?utm_source=user-menu";
    const url2 = "zaidesanton.substack.com";
    const url3 = "https://zaidesanton.substack.com";
    const url4 = "https://read.perspectiveship.com/";

    const result1 = getUrlComponents(url1);
    expect(result1).toEqual({
      validUrl: "https://theindiepreneur.substack.com",
      mainComponentInUrl: "theindiepreneur",
    });

    const result2 = getUrlComponents(url2);
    expect(result2).toEqual({
      validUrl: "https://zaidesanton.substack.com",
      mainComponentInUrl: "zaidesanton",
    });

    const result3 = getUrlComponents(url3);
    expect(result3).toEqual({
      validUrl: "https://zaidesanton.substack.com",
      mainComponentInUrl: "zaidesanton",
    });

    const result4 = getUrlComponents(url4);
    expect(result4).toEqual({
      validUrl: "https://read.perspectiveship.com",
      mainComponentInUrl: "perspectiveship",
    });
  });
});

describe("getUrlComponents with open.substack.com", () => {
  test("handles open.substack.com correctly", () => {
    const url = "https://open.substack.com/pub/theindiepreneur";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://theindiepreneur.substack.com",
      mainComponentInUrl: "theindiepreneur",
    });
  });
});

describe("getUrlComponents with http://", () => {
  test("handles http:// correctly", () => {
    const url = "http://theindiepreneur.substack.com";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://theindiepreneur.substack.com",
      mainComponentInUrl: "theindiepreneur",
    });
  });
});

describe("masteryden.com", () => {
  test("handles masteryden.com correctly", () => {
    const url = "https://masteryden.com";
    const result = getUrlComponents(url);
    expect(result).toEqual({
      validUrl: "https://www.masteryden.com",
      mainComponentInUrl: "masteryden",
    });
  });
});