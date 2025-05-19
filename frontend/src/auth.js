import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "./lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: false,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      authorization: { params: { access_type: "offline", prompt: "consent" } },
    }),
  ],
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    error: "/auth/error",
    signIn: "/auth",
    signOut: "/auth",
  },
  callbacks: {
    // [1] 최초 로그인시
    signIn: async ({ user, account, profile }) => {
      // FIXME : 하드코딩으로 특정 google 계정만 허용 추후 수정 필요
      // if (user.email !== "aisla.owner@gmail.com") {
      //   return false;
      // }
      // FIXME : user role admin 설정 (특정 google 계정만 허용)
      if (user.email == "aisla.owner@gmail.com") {
        user.role = "admin";
        return true;
      } else {
        return false;
      }
    },

    // [2] JWT 토큰 처리
    async jwt({ token, user, account, trigger, session }) {
      // 세션 첫 로그인시(account, user, (token) 모두 있음, 그 이후 callback => account만 있음)
      if (account && user) {
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
          role: user.role,
          nickname: user.nickname,
          id: user.id,
        }
      }

      // 업데이트 된 경우
      if (trigger === "update") {
        return {
          ...token,
          ...session?.user,
        };
      }
      

      // access token이 아직 유효한 경우
      if (Date.now() < token.expires_at * 1000) {

        return token
      }
      
      // access token이 만료된 경우 refresh
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID,
            client_secret: process.env.AUTH_GOOGLE_SECRET,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
          }),
        })

        const tokens = await response.json()

        console.log("refresh token response", tokens)

        if (!response.ok) throw tokens

        return {
          ...token,
          access_token: tokens.access_token,
          expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
          refresh_token: tokens.refresh_token ?? token.refresh_token,
        }

      } catch (error) {
        console.error("Error refreshing access token", error)
        await signOut();
        return {
          ...token,
          error: "RefreshAccessTokenError",
        }
      }
    },

    // [3] 세션에 필요한 정보 추가
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role
        session.user.access_token = token.access_token
        session.user.refresh_token = token.refresh_token
        session.user.nickname = token.nickname
        session.user.id = token.id
        session.error = token.error
      }
      return session
    },
  },

});
