export default function Avatar({ user, size = "md" }) {
  const src = user?.primaryProfileImage || user?.profileImage?.url || user?.profileImages?.[0]?.url;
  const cls = size === "lg" ? "avatar avatar-lg" : "avatar";
  return src
    ? <img className={cls} src={src} alt={`${user?.username || "User"} avatar`} />
    : <div className={cls + " avatar-fallback"}>{(user?.username || "U").slice(0,1).toUpperCase()}</div>;
}
