// // components/NewsCard.tsx
// import { useRouter } from "expo-router";
// import React from "react";
// import { Image, Text, TouchableOpacity, View } from "react-native";
// import { NewsItem } from "../types"; // or paste the type inline

// export default function NewsCard({ item }: { item: NewsItem }) {
//   const router = useRouter();

//   return (
//     <TouchableOpacity
//       onPress={() =>
//         router.push({
//           pathname: "/news/[id]",
//           params: {
//             id: item.id,
//             headline: item.headline,
//             content: item.content,
//             image: item.images[0] ?? "",
//             date_posted: item.date_posted,
//             author: item.manager_name ?? item.author,
//           },
//         })
//       }
//       className="p-4 mb-4 bg-white rounded-2xl shadow"
//     >
//       {item.images.length > 0 && (
//         <Image
//           source={{ uri: item.images[0] }}
//           className="w-full h-48 rounded-2xl"
//           resizeMode="cover"
//         />
//       )}
//       <Text className="text-lg font-semibold mt-2">{item.headline}</Text>
//       <View className="flex-row justify-between mt-1">
//         <Text className="text-xs text-gray-500">
//           by {item.manager_name ?? item.author}
//         </Text>
//         <Text className="text-xs text-gray-500">
//           {new Date(item.date_posted).toLocaleDateString()}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );
// }
