using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planner.Data.Planner.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDaylightSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LengthOfDayMinutes",
                table: "Rooms",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LengthOfNightMinutes",
                table: "Rooms",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RaceStartCondition",
                table: "Rooms",
                type: "TEXT",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TimeUntilTransitionMinutes",
                table: "Rooms",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TrackDaylightConditions",
                table: "Rooms",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LengthOfDayMinutes",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "LengthOfNightMinutes",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "RaceStartCondition",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "TimeUntilTransitionMinutes",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "TrackDaylightConditions",
                table: "Rooms");
        }
    }
}
