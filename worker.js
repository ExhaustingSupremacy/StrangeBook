export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);

    // --- Блок логики для ключей ---
    // Если путь состоит из 4 символов (это наш ключ)
    if (path.length === 4 && !path.includes('.')) {
      const key = path;

      // 1. Проверяем ключ в KV
      const storedValue = await env.MY_KV.get(key);

      if (!storedValue) {
        return new Response('Недействительная ссылка.', { status: 404 });
      }

      // 2. Проверяем, не использован ли он
      const data = JSON.parse(storedValue);
      if (data.used === true) {
        return new Response('Эта ссылка уже была использована.', { status: 410 });
      }

      // 3. Помечаем как использованный
      data.used = true;
      await env.MY_KV.put(key, JSON.stringify(data));

      // 4. Перенаправляем на файл
      return Response.redirect(data.fileUrl, 302);
    }

    // --- Блок для всей остальной статики ---
    // Если запрос не похож на ключ, отдаём статический файл из репозитория
    // (например, index.html)
    return env.ASSETS.fetch(request);
  },
};
