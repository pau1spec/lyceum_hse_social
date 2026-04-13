import {
  Body,
  Controller,
  Delete,
  Get,
  Post as HttpPost,
  Query,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  @HttpPost('register')
  async register(@Body() body: { email: string; password: string }) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return {
          message: 'Пользователь уже существует',
        };
      }

      const user = await this.prisma.user.create({
        data: {
          email: body.email,
          password: body.password,
        },
      });

      return {
        message: 'registered',
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('REGISTER ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @HttpPost('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user || user.password !== body.password) {
        return {
          message: 'Неверный email или пароль',
        };
      }

      const token = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      });

      return {
        message: 'ok',
        user: {
          id: user.id,
          email: user.email,
        },
        token,
      };
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @HttpPost('me')
  async me(@Body() body: { token: string }) {
    try {
      const payload = await this.jwtService.verifyAsync(body.token);

      return {
        message: 'ok',
        user: {
          id: payload.sub,
          email: payload.email,
        },
      };
    } catch (error) {
      console.error('ME ERROR:', error);
      return { message: 'Токен недействителен' };
    }
  }

  @HttpPost('groups')
  async createGroup(
    @Body() body: { token: string; name: string; description: string },
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(body.token);

      const group = await this.prisma.group.create({
        data: {
          name: body.name,
          description: body.description,
          ownerId: payload.sub,
        },
      });

      return {
        message: 'group_created',
        group,
      };
    } catch (error) {
      console.error('CREATE GROUP ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @Get('groups')
  async getGroups(@Query('q') q?: string) {
    try {
      const groups = await this.prisma.group.findMany({
        where: q
          ? {
              OR: [
                {
                  name: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : undefined,
        include: {
          owner: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'ok',
        groups,
      };
    } catch (error) {
      console.error('GET GROUPS ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @Get('users')
  async getUsers(@Query('q') q?: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: q
          ? {
              email: {
                contains: q,
                mode: 'insensitive',
              },
            }
          : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      return {
        message: 'ok',
        users,
      };
    } catch (error) {
      console.error('GET USERS ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @HttpPost('posts')
  async createPost(
    @Body()
    body: {
      token: string;
      groupId: string;
      title: string;
      content: string;
    },
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(body.token);

      const post = await this.prisma.post.create({
        data: {
          title: body.title,
          content: body.content,
          groupId: body.groupId,
          authorId: payload.sub,
        },
        include: {
          author: true,
          group: true,
          likes: true,
        },
      });

      return {
        message: 'post_created',
        post,
      };
    } catch (error) {
      console.error('CREATE POST ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @Get('posts')
  async getPosts(@Query('groupId') groupId: string) {
    try {
      const posts = await this.prisma.post.findMany({
        where: {
          groupId,
        },
        include: {
          author: true,
          group: true,
          likes: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'ok',
        posts,
      };
    } catch (error) {
      console.error('GET POSTS ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @Delete('posts')
  async deletePost(@Body() body: { token: string; postId: string }) {
    try {
      const payload = await this.jwtService.verifyAsync(body.token);

      const post = await this.prisma.post.findUnique({
        where: { id: body.postId },
      });

      if (!post) {
        return { message: 'Пост не найден' };
      }

      if (post.authorId !== payload.sub) {
        return { message: 'Можно удалять только свои посты' };
      }

      await this.prisma.postLike.deleteMany({
        where: { postId: body.postId },
      });

      await this.prisma.comment.deleteMany({
        where: { postId: body.postId },
      });

      await this.prisma.post.delete({
        where: { id: body.postId },
      });

      return { message: 'post_deleted' };
    } catch (error) {
      console.error('DELETE POST ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @HttpPost('comments')
  async createComment(
    @Body()
    body: {
      token: string;
      postId: string;
      content: string;
    },
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(body.token);

      const comment = await this.prisma.comment.create({
        data: {
          content: body.content,
          postId: body.postId,
          authorId: payload.sub,
        },
        include: {
          author: true,
          post: true,
        },
      });

      return {
        message: 'comment_created',
        comment,
      };
    } catch (error) {
      console.error('CREATE COMMENT ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @Get('comments')
  async getComments(@Query('postId') postId: string) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: {
          postId,
        },
        include: {
          author: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return {
        message: 'ok',
        comments,
      };
    } catch (error) {
      console.error('GET COMMENTS ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @Delete('comments')
  async deleteComment(@Body() body: { token: string; commentId: string }) {
    try {
      const payload = await this.jwtService.verifyAsync(body.token);

      const comment = await this.prisma.comment.findUnique({
        where: { id: body.commentId },
      });

      if (!comment) {
        return { message: 'Комментарий не найден' };
      }

      if (comment.authorId !== payload.sub) {
        return { message: 'Можно удалять только свои комментарии' };
      }

      await this.prisma.comment.delete({
        where: { id: body.commentId },
      });

      return { message: 'comment_deleted' };
    } catch (error) {
      console.error('DELETE COMMENT ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }

  @HttpPost('posts/like')
  async likePost(@Body() body: { token: string; postId: string }) {
    try {
      const payload = await this.jwtService.verifyAsync(body.token);

      const existingLike = await this.prisma.postLike.findFirst({
        where: {
          postId: body.postId,
          userId: payload.sub,
        },
      });

      if (existingLike) {
        await this.prisma.postLike.delete({
          where: {
            userId_postId: {
              userId: payload.sub,
              postId: body.postId,
            },
          },
        });

        return { message: 'unliked' };
      }

      await this.prisma.postLike.create({
        data: {
          postId: body.postId,
          userId: payload.sub,
        },
      });

      return { message: 'liked' };
    } catch (error) {
      console.error('LIKE POST ERROR:', error);
      return { statusCode: 500, message: 'Internal server error' };
    }
  }
}