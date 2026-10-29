using Hub.Data;
using Hub.Services;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(builder.Configuration["urls"] ?? "http://127.0.0.1:5080");

// ASP.NET создаёт контроллеры и передаёт им зарегистрированные зависимости.
builder.Services.AddControllers();
builder.Services.AddSingleton<HubDatabase>();
builder.Services.AddScoped<ProjectRepository>();
builder.Services.AddScoped<ProjectService>();
builder.Services.AddScoped<DocumentRepository>();
builder.Services.AddScoped<TaskRepository>();
builder.Services.AddSingleton<WorkspaceFileService>();

var app = builder.Build();
app.Services.GetRequiredService<HubDatabase>().Initialize();

app.MapControllers();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();
