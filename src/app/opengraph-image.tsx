// ScreenLog Open Graph Image
import { ImageResponse } from 'next/og';

export const alt = "ScreenLog app preview";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const appName = "ScreenLog";
const description = "ScreenLog 是一个纯本地的电脑使用时间观察工具，不设目标、不弹提醒、不评判。自动采集前台应用使用时长，通过热力图、河流图和叙事时间轴三种视角呈现你的使用习惯。生成冷幽默式每日/每周文案总结，解锁基于已发生行为的趣味成就徽章。所有数据本地存储，支持离线导出 HTML/PDF 报告。让你像翻手...";

function isImageIcon(value: string) {
  return value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://');
}

export default function Image() {
  const fallbackGlyph = appName.trim().slice(0, 1).toUpperCase() || 'S';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F7F4EE',
          color: '#1D1B18',
          padding: '76px',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 168,
              height: 168,
              borderRadius: 40,
              background: '#FFFFFF',
              border: '1px solid #E4DED4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginRight: 44,
            }}
          >
            <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1 }}>
              {fallbackGlyph}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: 0 }}>
              {appName}
            </div>
            <div
              style={{
                fontSize: 32,
                lineHeight: 1.35,
                color: '#5F5A52',
                marginTop: 24,
                maxWidth: 760,
              }}
            >
              {description}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
