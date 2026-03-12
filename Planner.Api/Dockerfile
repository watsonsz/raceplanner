FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Planner.Api/Planner.Api.csproj", "Planner.Api/"]
COPY ["Planner.Data/Planner.Data.csproj", "Planner.Data/"]

RUN dotnet restore "Planner.Api/Planner.Api.csproj"

COPY . .

WORKDIR "/src/Planner.Api"
RUN dotnet publish "Planner.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Planner.Api.dll"]
