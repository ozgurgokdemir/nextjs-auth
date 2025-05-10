import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession, getSession } from '@/lib/auth/session';
import { getOAuthClient, providerSchema } from '@/lib/auth/oauth';
import { prisma } from '@/lib/db/prisma';

const paramsSchema = z.object({
  provider: providerSchema,
});
const searchParamsSchema = z.object({
  code: z.string(),
  state: z.string(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<z.infer<typeof paramsSchema>> }
) {
  try {
    const { provider } = paramsSchema.parse(await params);
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { state, code } = searchParamsSchema.parse(searchParams);

    const oAuth = getOAuthClient(provider);
    const oAuthUser = await oAuth.getUser(state, code);
    if (!oAuthUser) throw new Error('Failed to get user from OAuth provider');

    const session = await getSession();

    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: session ? { id: session.id } : { email: oAuthUser.email },
        include: {
          providers: true,
        },
      });

      if (!existingUser) {
        const user = tx.user.create({
          data: {
            email: oAuthUser.email,
            name: oAuthUser.name,
            avatar: oAuthUser.avatar,
            providers: {
              create: {
                provider,
                providerId: oAuthUser.id,
              },
            },
          },
        });

        return user;
      }

      const existingProvider = existingUser.providers.find(
        (p) => p.provider === provider
      );

      if (!existingProvider) {
        await tx.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            avatar: existingUser.avatar ?? oAuthUser.avatar,
            providers: {
              create: {
                provider,
                providerId: oAuthUser.id,
              },
            },
          },
        });
      }

      return existingUser;
    });

    await createSession(user);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Something went wrong!' },
      { status: 500 }
    );
  }

  redirect('/dashboard');
}
