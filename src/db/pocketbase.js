import PocketBase from "pocketbase";

const pbHost = import.meta.env.VITE_PB_URL;
console.log("PB1 Host", pbHost);
const pb = new PocketBase(pbHost);
pb.autoCancellation(false);
export default pb;
