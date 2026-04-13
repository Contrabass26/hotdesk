using Microsoft.EntityFrameworkCore;
using Hotdesk.EntityFramework.Models;

namespace Hotdesk.EntityFramework;

public partial class HotdeskDbContext : DbContext
{
    public HotdeskDbContext()
    {
    }

    public HotdeskDbContext(DbContextOptions<HotdeskDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Booking> Bookings { get; set; }

    public virtual DbSet<Department> Departments { get; set; }

    public virtual DbSet<Desk> Desks { get; set; }

    public virtual DbSet<Floor> Floors { get; set; }

    public virtual DbSet<Team> Teams { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Wall> Walls { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=mydb;Username=myuser;Password=mypass");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("btree_gist");

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.BookingId).HasName("bookings_pkey");

            entity.ToTable("bookings");

            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeskId).HasColumnName("desk_id");
            entity.Property(e => e.EndTime)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("end_time");
            entity.Property(e => e.StartTime)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("start_time");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValueSql("'confirmed'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Desk).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.DeskId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("bookings_desk_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("bookings_user_id_fkey");
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.DepartmentId).HasName("departments_pkey");

            entity.ToTable("departments");

            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.Name)
                .HasMaxLength(30)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Desk>(entity =>
        {
            entity.HasKey(e => e.DeskId).HasName("desks_pkey");

            entity.ToTable("desks");

            entity.Property(e => e.DeskId).HasColumnName("desk_id");
            entity.Property(e => e.FloorId).HasColumnName("floor_id");
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true)
                .HasColumnName("is_enabled");
            entity.Property(e => e.Label)
                .HasMaxLength(50)
                .HasColumnName("label");
            entity.Property(e => e.XCoord)
                .HasPrecision(5, 2)
                .HasColumnName("x_coord");
            entity.Property(e => e.YCoord)
                .HasPrecision(5, 2)
                .HasColumnName("y_coord");

            entity.HasOne(d => d.Floor).WithMany(p => p.Desks)
                .HasForeignKey(d => d.FloorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("desks_floor_id_fkey");
        });

        modelBuilder.Entity<Floor>(entity =>
        {
            entity.HasKey(e => e.FloorId).HasName("floors_pkey");

            entity.ToTable("floors");

            entity.Property(e => e.FloorId).HasColumnName("floor_id");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.TeamId).HasName("teams_pkey");

            entity.ToTable("teams");

            entity.Property(e => e.TeamId).HasColumnName("team_id");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");

            entity.HasOne(d => d.Department).WithMany(p => p.Teams)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("teams_department_id_fkey");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("users_pkey");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.IsAdmin)
                .HasDefaultValue(false)
                .HasColumnName("is_admin");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.TeamId).HasColumnName("team_id");

            entity.HasOne(d => d.Team).WithMany(p => p.Users)
                .HasForeignKey(d => d.TeamId)
                .HasConstraintName("users_team_id_fkey");
        });

        modelBuilder.Entity<Wall>(entity =>
        {
            entity.HasKey(e => e.WallId).HasName("walls_pkey");

            entity.ToTable("walls");

            entity.Property(e => e.WallId).HasColumnName("wall_id");
            entity.Property(e => e.FloorId).HasColumnName("floor_id");
            entity.Property(e => e.XEnd)
                .HasPrecision(5, 2)
                .HasColumnName("x_end");
            entity.Property(e => e.XStart)
                .HasPrecision(5, 2)
                .HasColumnName("x_start");
            entity.Property(e => e.YEnd)
                .HasPrecision(5, 2)
                .HasColumnName("y_end");
            entity.Property(e => e.YStart)
                .HasPrecision(5, 2)
                .HasColumnName("y_start");

            entity.HasOne(d => d.Floor).WithMany(p => p.Walls)
                .HasForeignKey(d => d.FloorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("walls_floor_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
