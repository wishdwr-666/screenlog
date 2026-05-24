export function getMoodEmoji(seconds: number) {
  const hours = seconds / 3600;
  if (hours < 2) return { emoji: "🐌", title: "不慌不忙的蜗牛", quote: "你在各个应用间慢悠悠晃落的一天，像在草叶上留下一道粘稠而无害的白色轨迹。" };
  if (hours < 4) return { emoji: "🦥", title: "佛系树懒", quote: "慢即是快，少即是多，你今天用极简的节奏证明了生活不必焦虑。" };
  if (hours < 7) return { emoji: "🐱", title: "悠闲猫咪", quote: "上午晒太阳，下午看窗外，晚上摸两下屏幕——今天的你像一只安静的家猫。" };
  if (hours < 10) return { emoji: "🐝", title: "勤劳蜜蜂", quote: "你今天在数字花园里来回穿梭，采集了不少信息花粉。" };
  return { emoji: "🦉", title: "深夜猫头鹰", quote: "天黑才是你的真实开场。电脑在深夜发出的微光是你唯一的陪伴。" };
}
