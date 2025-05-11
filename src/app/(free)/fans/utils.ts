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
];

/**
 * Generates a specified number of|d fake engagers
 */
export const generateFakeEngagers = (count: number): Engager[] => {
  const fakes =  Array.from({ length: count }).map((_, index) => ({
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
