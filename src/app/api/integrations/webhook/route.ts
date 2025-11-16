import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, data, platform } = body;

    if (!webhookUrl || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let payload;

    if (platform === 'slack') {
      payload = {
        text: `New Research Report: ${data.topic}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Research Report: ${data.topic}*\n\nTotal Items: ${data.items.length}\nClusters: ${data.clusters.length}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Top Pain Points:*\n${data.summary.topPainPoints.slice(0, 3).join('\n')}`,
            },
          },
        ],
      };
    } else if (platform === 'discord') {
      payload = {
        content: `**New Research Report: ${data.topic}**\n\nTotal Items: ${data.items.length}\nClusters: ${data.clusters.length}\n\n**Top Pain Points:**\n${data.summary.topPainPoints.slice(0, 3).join('\n')}`,
      };
    } else {
      payload = data;
    }

    await axios.post(webhookUrl, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
