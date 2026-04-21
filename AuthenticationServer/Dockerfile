FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["AuthenticationServer.csproj", "./"]
RUN dotnet restore "AuthenticationServer.csproj"
COPY --chown=app:app . .
WORKDIR "/src/"
RUN dotnet build "./AuthenticationServer.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./AuthenticationServer.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --chown=app:app --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AuthenticationServer.dll"]
