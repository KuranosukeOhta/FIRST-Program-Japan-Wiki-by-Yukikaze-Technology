import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SYNC_API_SECRET}`) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    // 全てのパスを再検証
    revalidatePath('/');
    revalidatePath('/wiki');
    revalidatePath('/wiki/[id]');

    return NextResponse.json({ 
      success: true,
      message: 'キャッシュを正常にクリアしました'
    });
  } catch (error) {
    console.error('キャッシュクリアエラー:', error);
    return NextResponse.json({ 
      error: 'キャッシュクリア中にエラーが発生しました',
      details: error.message
    }, { status: 500 });
  }
} 