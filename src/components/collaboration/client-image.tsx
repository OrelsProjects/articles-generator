import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const ClientImage = ({
  image,
  name,
}: {
  image?: string | null;
  name: string;
}) => {
  const Fallback = () => (
    <AvatarFallback className="text-xs">
      {name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()}
    </AvatarFallback>
  );

  return image ? (
    <Avatar className="h-8 w-8">
      <AvatarImage
        src={image}
        onError={e => {
          console.log("error", e);
        }}
      />
      <Fallback />
    </Avatar>
  ) : (
    <Avatar>
      <Fallback />
    </Avatar>
  );
};
