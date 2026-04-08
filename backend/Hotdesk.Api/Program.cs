using Hotdesk.Core;
using Hotdesk.Core.Services;
using Hotdesk.Core.Services.Interfaces;
using Hotdesk.EntityFramework;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// API metadata
builder.Services.AddOpenApi();

builder.Configuration.AddEnvironmentVariables();

// Adds database connection
builder.Services.AddDbContext<HotdeskDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("Db"));
});

// Adds the mapper between database objects and core objects
builder.Services.AddAutoMapper(cfg => {}, typeof(AutoMapperProfile).Assembly);

// Adds the services
builder.Services.AddScoped<IUserService, UserService>();

// Adds the controllers (API endpoints)
builder.Services.AddControllers();

// Adds endpoint explorers if in development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Hotdesk.Api",
            Version = "v1"
        });
    });
}

var app = builder.Build();

// Enables endpoint explorers if in development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Map the routes created by the controllers
app.MapControllers();

// app.UseHttpsRedirection();

app.Run();
