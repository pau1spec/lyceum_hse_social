import { useEffect, useState } from "react";
import "./App.css";

type MeResponse = {
  message: string;
  user?: {
    id: string;
    email: string;
  };
  token?: string;
};

type Group = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  owner: {
    id: string;
    email: string;
  };
};

type UserItem = {
  id: string;
  email: string;
  createdAt: string;
};

type GroupsResponse = {
  message: string;
  groups?: Group[];
};

type UsersResponse = {
  message: string;
  users?: UserItem[];
};

type PostItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
  };
  group: {
    id: string;
    name: string;
  };
  likes: {
    id: string;
    userId: string;
    postId: string;
  }[];
};

type PostsResponse = {
  message: string;
  posts?: PostItem[];
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
  };
};

type CommentsResponse = {
  message: string;
  comments?: CommentItem[];
};

function App() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);

  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const selectedPost = posts.find((p) => p.id === selectedPostId);

  const loadGroups = async (q = "") => {
    try {
      const url = q
        ? `http://localhost:3000/groups?q=${encodeURIComponent(q)}`
        : "http://localhost:3000/groups";

      const res = await fetch(url);
      const data: GroupsResponse = await res.json();

      if (data.groups) {
        setGroups(data.groups);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("LOAD GROUPS ERROR:", error);
      setGroups([]);
    }
  };

  const loadUsers = async (q = "") => {
    try {
      const url = q
        ? `http://localhost:3000/users?q=${encodeURIComponent(q)}`
        : "http://localhost:3000/users";

      const res = await fetch(url);
      const data: UsersResponse = await res.json();

      if (data.users) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("LOAD USERS ERROR:", error);
      setUsers([]);
    }
  };

  const loadPosts = async (groupId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/posts?groupId=${groupId}`);
      const data: PostsResponse = await res.json();

      if (data.posts) {
        setPosts(data.posts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("LOAD POSTS ERROR:", error);
      setPosts([]);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/comments?postId=${postId}`);
      const data: CommentsResponse = await res.json();

      if (data.comments) {
        setComments(data.comments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("LOAD COMMENTS ERROR:", error);
      setComments([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    const init = async () => {
      if (!token) {
        await loadGroups();
        await loadUsers();
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/me", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data: MeResponse = await res.json();

        if (data.message === "ok" && data.user?.email) {
          setCurrentUser(data.user.email);
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("ME ERROR:", error);
        localStorage.removeItem("token");
      } finally {
        await loadGroups();
        await loadUsers();
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url =
      mode === "login"
        ? "http://localhost:3000/login"
        : "http://localhost:3000/register";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: MeResponse = await res.json();

      if (data.message) {
        setMessage(data.message);
      }

      if (data.message === "ok" && data.user?.email && data.token) {
        localStorage.setItem("token", data.token);
        setCurrentUser(data.user.email);
        setEmail("");
        setPassword("");
        setMessage("");
      }
    } catch (error) {
      console.error("SUBMIT ERROR:", error);
      setMessage("Ошибка соединения с сервером");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Сначала войди в систему");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          name: groupName,
          description: groupDescription,
        }),
      });

      const data = await res.json();

      if (data.message === "group_created") {
        setGroupName("");
        setGroupDescription("");
        setMessage("Группа создана");
        await loadGroups(groupSearch);
      } else {
        setMessage(data.message || "Ошибка создания группы");
      }
    } catch (error) {
      console.error("CREATE GROUP ERROR:", error);
      setMessage("Ошибка создания группы");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Сначала войди в систему");
      return;
    }

    if (!selectedGroupId) {
      setMessage("Сначала выбери группу");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          groupId: selectedGroupId,
          title: postTitle,
          content: postContent,
        }),
      });

      const data = await res.json();

      if (data.message === "post_created") {
        setPostTitle("");
        setPostContent("");
        setMessage("Пост создан");
        await loadPosts(selectedGroupId);
      } else {
        setMessage(data.message || "Ошибка создания поста");
      }
    } catch (error) {
      console.error("CREATE POST ERROR:", error);
      setMessage("Ошибка создания поста");
    }
  };

  const handleDeletePost = async (postId: string) => {
    const token = localStorage.getItem("token");
    if (!token || !selectedGroupId) return;

    try {
      const res = await fetch("http://localhost:3000/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          postId,
        }),
      });

      const data = await res.json();
      setMessage(data.message);

      if (data.message === "post_deleted") {
        setSelectedPostId(null);
        setComments([]);
        await loadPosts(selectedGroupId);
      }
    } catch (error) {
      console.error("DELETE POST ERROR:", error);
    }
  };

  const handleLikePost = async (postId: string) => {
    const token = localStorage.getItem("token");
    if (!token || !selectedGroupId) return;

    try {
      const res = await fetch("http://localhost:3000/posts/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          postId,
        }),
      });

      const data = await res.json();
      setMessage(data.message);
      await loadPosts(selectedGroupId);
    } catch (error) {
      console.error("LIKE POST ERROR:", error);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Сначала войди в систему");
      return;
    }

    if (!selectedPostId) {
      setMessage("Сначала выбери пост");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          postId: selectedPostId,
          content: commentContent,
        }),
      });

      const data = await res.json();

      if (data.message === "comment_created") {
        setCommentContent("");
        setMessage("Комментарий создан");
        await loadComments(selectedPostId);
      } else {
        setMessage(data.message || "Ошибка создания комментария");
      }
    } catch (error) {
      console.error("CREATE COMMENT ERROR:", error);
      setMessage("Ошибка создания комментария");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const token = localStorage.getItem("token");
    if (!token || !selectedPostId) return;

    try {
      const res = await fetch("http://localhost:3000/comments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          commentId,
        }),
      });

      const data = await res.json();
      setMessage(data.message);

      if (data.message === "comment_deleted") {
        await loadComments(selectedPostId);
      }
    } catch (error) {
      console.error("DELETE COMMENT ERROR:", error);
    }
  };

  const handleSelectGroup = async (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedPostId(null);
    setComments([]);
    await loadPosts(groupId);
  };

  const handleSelectPost = async (postId: string) => {
    setSelectedPostId(postId);
    await loadComments(postId);
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setEmail("");
    setPassword("");
    setMessage("");
    setSelectedGroupId(null);
    setSelectedPostId(null);
    setPosts([]);
    setComments([]);
    await loadGroups(groupSearch);
    await loadUsers(userSearch);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="card">
            <h1>Загрузка...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="page">
        <div className="container">
          <div className="topbar">
            <div>
              <h1 className="title">Лицей Social</h1>
              <p className="subtitle">Ты вошёл как {currentUser}</p>
            </div>
            <button className="danger-btn" onClick={handleLogout}>
              Выйти
            </button>
          </div>

          {message && <div className="message">{message}</div>}

          <div className="grid two-columns">
            <div className="card">
              <h2>Поиск групп</h2>
              <div className="row">
                <input
                  className="input"
                  type="text"
                  placeholder="Найти группу"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                />
                <button className="primary-btn" onClick={() => loadGroups(groupSearch)}>
                  Искать
                </button>
              </div>

              <h2 className="section-title">Создать группу</h2>
              <form onSubmit={handleCreateGroup} className="form">
                <input
                  className="input"
                  type="text"
                  placeholder="Название группы"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <textarea
                  className="textarea"
                  placeholder="Описание группы"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
                <button className="primary-btn" type="submit">
                  Создать группу
                </button>
              </form>
            </div>

            <div className="card">
              <h2>Поиск пользователей</h2>
              <div className="row">
                <input
                  className="input"
                  type="text"
                  placeholder="Найти пользователя"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <button className="primary-btn" onClick={() => loadUsers(userSearch)}>
                  Искать
                </button>
              </div>

              <div className="list">
                {users.length === 0 ? (
                  <p className="empty">Пользователи не найдены</p>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="list-item">
                      <strong>{user.email}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Список групп</h2>
            <div className="list">
              {groups.length === 0 ? (
                <p className="empty">Пока групп нет</p>
              ) : (
                groups.map((group) => (
                  <div key={group.id} className="list-item">
                    <div className="item-header">
                      <div>
                        <h3>{group.name}</h3>
                        <p>{group.description}</p>
                        <p className="muted">Создатель: {group.owner.email}</p>
                      </div>
                      <button
                        className="secondary-btn"
                        onClick={() => handleSelectGroup(group.id)}
                      >
                        Открыть
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedGroupId && (
            <div className="card">
              <h2>Группа: {selectedGroup?.name ?? "Выбрана группа"}</h2>

              <h3 className="section-title">Создать пост</h3>
              <form onSubmit={handleCreatePost} className="form">
                <input
                  className="input"
                  type="text"
                  placeholder="Заголовок поста"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
                <textarea
                  className="textarea"
                  placeholder="Текст поста"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <button className="primary-btn" type="submit">
                  Создать пост
                </button>
              </form>

              <h3 className="section-title">Посты группы</h3>
              <div className="list">
                {posts.length === 0 ? (
                  <p className="empty">Постов пока нет</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="list-item">
                      <h3>{post.title}</h3>
                      <p>{post.content}</p>
                      <p className="muted">Автор: {post.author.email}</p>
                      <p className="muted">Лайков: {post.likes.length}</p>

                      <div className="actions">
                        <button
                          className="secondary-btn"
                          onClick={() => handleSelectPost(post.id)}
                        >
                          Комментарии
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => handleLikePost(post.id)}
                        >
                          Лайк / убрать
                        </button>
                        <button
                          className="danger-btn"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Удалить пост
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedPostId && (
            <div className="card">
              <h2>Комментарии к посту: {selectedPost?.title ?? "Пост"}</h2>

              <form onSubmit={handleCreateComment} className="form">
                <textarea
                  className="textarea"
                  placeholder="Текст комментария"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <button className="primary-btn" type="submit">
                  Отправить комментарий
                </button>
              </form>

              <div className="list">
                {comments.length === 0 ? (
                  <p className="empty">Комментариев пока нет</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="list-item">
                      <p>{comment.content}</p>
                      <p className="muted">Автор: {comment.author.email}</p>
                      <div className="actions">
                        <button
                          className="danger-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Удалить комментарий
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="auth-wrapper">
        <div className="auth-card">
          <h1 className="title">{mode === "login" ? "Вход" : "Регистрация"}</h1>

          <div className="tabs">
            <button
              className={mode === "login" ? "tab active-tab" : "tab"}
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Вход
            </button>

            <button
              className={mode === "register" ? "tab active-tab" : "tab"}
              type="button"
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              Регистрация
            </button>
          </div>

          {message && <div className="message">{message}</div>}

          <form onSubmit={handleSubmit} className="form">
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="input"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="primary-btn full-width" type="submit">
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>
        </div>

        <div className="public-card">
          <h2>Публичные группы</h2>

          <div className="row">
            <input
              className="input"
              type="text"
              placeholder="Найти группу"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
            <button className="primary-btn" onClick={() => loadGroups(groupSearch)}>
              Искать
            </button>
          </div>

          <div className="list">
            {groups.length === 0 ? (
              <p className="empty">Пока групп нет</p>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="list-item">
                  <h3>{group.name}</h3>
                  <p>{group.description}</p>
                  <p className="muted">Создатель: {group.owner.email}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;