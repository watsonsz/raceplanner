using Microsoft.EntityFrameworkCore;

namespace Planner.Data;

public class PlannerDb : DbContext
{
    public PlannerDb(DbContextOptions<PlannerDb> options) : base(options) { }

    public DbSet<RaceRoom> Rooms => Set<RaceRoom>();
    public DbSet<PersonScheduleEntity> People => Set<PersonScheduleEntity>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<DriverVehicleProficiency> Proficiencies => Set<DriverVehicleProficiency>();
    public DbSet<ScheduleEntry> ScheduleEntries => Set<ScheduleEntry>();
  
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RaceRoom>()
            .HasIndex(r => r.Code)
            .IsUnique();

        modelBuilder.Entity<PersonScheduleEntity>()
            .HasIndex(p => new { p.RoomId, p.Group, p.PersonId })
            .IsUnique();
        modelBuilder.Entity<Vehicle>()
        .HasIndex(v => new { v.RoomId, v.Name });

    modelBuilder.Entity<DriverVehicleProficiency>()
        .HasIndex(p => new { p.RoomId, p.PersonId, p.VehicleId })
        .IsUnique();

    modelBuilder.Entity<ScheduleEntry>()
        .HasIndex(s => new { s.RoomId, s.BlockIndex, s.Role })
        .IsUnique();

        base.OnModelCreating(modelBuilder);
    }
}
