export function generateToken({
  length = 12,
  useUppercase = true,
  useLowercase = true,
  useNumbers = true,
  useSpecial = false,
} = {}) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";

  let charset = "";
  if (useUppercase) charset += uppercase;
  if (useLowercase) charset += lowercase;
  if (useNumbers) charset += numbers;
  if (useSpecial) charset += special;

  if (!charset) throw new Error("You must select at least one character set");

  let token = "";
  for (let i = 0; i < length; i++) {
    const randIndex = Math.floor(Math.random() * charset.length);
    token += charset[randIndex];
  }

  return token;
}
