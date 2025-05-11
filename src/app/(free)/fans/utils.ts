import { Engager } from "@/types/engager";

// Collection of placeholder avatar URLs from Pexels
const placeholderAvatars = [
  "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1499327/pexels-photo-1499327.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/936117/pexels-photo-936117.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/712521/pexels-photo-712521.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/247917/pexels-photo-247917.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1043470/pexels-photo-1043470.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/3748221/pexels-photo-3748221.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/2379003/pexels-photo-2379003.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1506815/pexels-photo-1506815.jpeg?auto=compress&cs=tinysrgb&w=150",
];

// Names for fake engagers
const names = [
  "Alex Johnson",
  "Sam Taylor",
  "Jordan Lee",
  "Riley Smith",
  "Casey Park",
  "Morgan Davis",
  "Taylor Brown",
  "Jamie Wilson",
  "Drew Garcia",
  "Quinn Martin",
  "Cameron Brooks",
  "Reese Thompson",
  "Skyler Adams",
  "Peyton Carter",
  "Dakota Morgan",
  "Harper Bailey",
  "Avery Cooper",
  "Emerson Kelly",
  "Sawyer Bell",
  "Finley Hayes",
  "Logan Price",
  "Rowan Kennedy",
  "Blake Foster",
  "Hayden Wells",
  "Charlie Griffin",
];

/**
 * Generates a specified number of|d fake engagers
 */
export const generateFakeEngagers = (count: number): Engager[] => {
  const fakes = Array.from({ length: count }).map((_, index) => ({
    authorId: `fake-${index}`,
    name: names[index % names.length],
    photoUrl: placeholderAvatars[index % placeholderAvatars.length],
    subscriberCount: Math.floor(Math.random() * 100),
    subscriberCountString: Math.floor(Math.random() * 100).toString(),
    score: Math.floor(Math.random() * 100),
    handle: `${names[index % names.length].toLowerCase().replace(" ", "_")}`,
  }));
  console.log(fakes);
  return fakes;
};

/**
 * Calculates the position of each avatar in the stack
 */
export const calculatePositions = (
  totalCount: number,
  maxWidth: number,
): number[] => {
  // If we have few engagers, space them out more
  const spacing = totalCount <= 5 ? 40 : totalCount <= 10 ? 30 : 24;
  return Array.from({ length: totalCount }).map((_, i) => i * spacing);
};
