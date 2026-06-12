using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCampus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileAndAppointmentScheduleId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "Users",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficeLocation",
                table: "Users",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResearchAreas",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ScheduleId",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ScheduleId",
                table: "Appointments",
                column: "ScheduleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_TeacherSchedules_ScheduleId",
                table: "Appointments",
                column: "ScheduleId",
                principalTable: "TeacherSchedules",
                principalColumn: "ID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_TeacherSchedules_ScheduleId",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_ScheduleId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "Bio",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OfficeLocation",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ResearchAreas",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ScheduleId",
                table: "Appointments");
        }
    }
}
